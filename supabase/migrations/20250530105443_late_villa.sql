/*
  # System Configuration and RBAC Enforcement

  1. New Tables
    - `system_configurations` - Stores global system configuration settings
    - `user_permissions` - Stores detailed user permissions beyond basic roles

  2. Security
    - Enable RLS on all tables
    - Add policies for different user roles (admin, manager, finance, viewer)
    - Enforce role-based access control at the database level
*/

-- Create system_configurations table for global settings
CREATE TABLE IF NOT EXISTS system_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  category text NOT NULL,
  is_protected boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE system_configurations ENABLE ROW LEVEL SECURITY;

-- Create policies for system_configurations
CREATE POLICY "Anyone can read system configurations"
  ON system_configurations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can create system configurations"
  ON system_configurations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update non-protected system configurations"
  ON system_configurations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete system configurations"
  ON system_configurations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create user_permissions table for fine-grained permissions
CREATE TABLE IF NOT EXISTS user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_type text NOT NULL,
  resource_id text,
  permission text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE(user_id, resource_type, resource_id, permission)
);

-- Enable RLS
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies for user_permissions
CREATE POLICY "Users can read their own permissions"
  ON user_permissions
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can manage permissions"
  ON user_permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create indexes
CREATE INDEX user_permissions_user_id_idx ON user_permissions(user_id);
CREATE INDEX user_permissions_resource_type_idx ON user_permissions(resource_type);
CREATE INDEX user_permissions_resource_id_idx ON user_permissions(resource_id);
CREATE INDEX system_configurations_category_idx ON system_configurations(category);
CREATE INDEX system_configurations_key_idx ON system_configurations(key);

-- Insert default system configurations
INSERT INTO system_configurations (key, value, description, category, is_protected)
VALUES
  ('company.name', '"Zepth Edge"', 'Company name displayed throughout the application', 'general', false),
  ('company.support_email', '"support@zepthedge.com"', 'Support email address', 'general', false),
  ('date_format', '"MM/DD/YYYY"', 'Default date format', 'display', false),
  ('currency_display', '"symbol"', 'How to display currency (symbol, code, or name)', 'display', false),
  ('notifications.maintenance', 'true', 'Enable maintenance notifications', 'notifications', false),
  ('documents.approval_required', 'true', 'Require approval for document uploads', 'documents', false),
  ('budget.warning_threshold', '75', 'Budget warning threshold percentage', 'budget', false),
  ('budget.critical_threshold', '90', 'Budget critical threshold percentage', 'budget', false),
  ('rbac.enabled', 'true', 'Enable role-based access control', 'security', true),
  ('rbac.roles', '["admin", "manager", "finance", "viewer"]', 'Available user roles', 'security', true),
  ('rbac.permissions', '{
    "admin": ["*"],
    "manager": ["read.*", "write.property.*", "write.asset.*", "write.document.*", "write.disposal.*", "write.task.*", "write.rfi.*", "write.submittal.*", "write.transmittal.*"],
    "finance": ["read.*", "write.budget.*", "write.capex.*", "write.budget_transfer.*"],
    "viewer": ["read.*"]
  }', 'Default permissions for each role', 'security', true);

-- Create function to check user permissions
CREATE OR REPLACE FUNCTION check_user_permission(
  user_id uuid,
  required_permission text,
  resource_type text DEFAULT NULL,
  resource_id text DEFAULT NULL
) RETURNS boolean AS $$
DECLARE
  user_role text;
  has_permission boolean;
BEGIN
  -- Get user role
  SELECT role INTO user_role FROM profiles WHERE id = user_id;
  
  -- Admin has all permissions
  IF user_role = 'admin' THEN
    RETURN true;
  END IF;
  
  -- Check specific permission
  SELECT EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_permissions.user_id = check_user_permission.user_id
    AND user_permissions.permission = check_user_permission.required_permission
    AND (
      check_user_permission.resource_type IS NULL OR
      user_permissions.resource_type = check_user_permission.resource_type
    )
    AND (
      check_user_permission.resource_id IS NULL OR
      user_permissions.resource_id = check_user_permission.resource_id
    )
  ) INTO has_permission;
  
  -- If specific permission exists, return true
  IF has_permission THEN
    RETURN true;
  END IF;
  
  -- Check role-based permissions from system configuration
  DECLARE
    role_permissions jsonb;
  BEGIN
    SELECT value::jsonb -> user_role INTO role_permissions
    FROM system_configurations
    WHERE key = 'rbac.permissions';
    
    IF role_permissions IS NOT NULL THEN
      -- Check if role has wildcard permission
      IF role_permissions ? '*' THEN
        RETURN true;
      END IF;
      
      -- Check if role has the specific permission
      IF role_permissions ? required_permission THEN
        RETURN true;
      END IF;
      
      -- Check for wildcard permissions (e.g., "read.*")
      DECLARE
        permission_parts text[];
        wildcard_permission text;
      BEGIN
        permission_parts := string_to_array(required_permission, '.');
        
        IF array_length(permission_parts, 1) >= 2 THEN
          wildcard_permission := permission_parts[1] || '.*';
          
          IF role_permissions ? wildcard_permission THEN
            RETURN true;
          END IF;
        END IF;
      END;
    END IF;
  END;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(user_id uuid)
RETURNS jsonb AS $$
DECLARE
  user_role text;
  role_permissions jsonb;
  specific_permissions jsonb;
  result jsonb;
BEGIN
  -- Get user role
  SELECT role INTO user_role FROM profiles WHERE id = user_id;
  
  -- Get role-based permissions
  SELECT value::jsonb -> user_role INTO role_permissions
  FROM system_configurations
  WHERE key = 'rbac.permissions';
  
  -- Get specific user permissions
  SELECT jsonb_object_agg(permission, 
    jsonb_build_object(
      'resource_type', resource_type,
      'resource_id', resource_id
    )
  ) INTO specific_permissions
  FROM user_permissions
  WHERE user_permissions.user_id = get_user_permissions.user_id;
  
  -- Combine permissions
  result := jsonb_build_object(
    'role', user_role,
    'role_permissions', role_permissions,
    'specific_permissions', COALESCE(specific_permissions, '{}'::jsonb)
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;