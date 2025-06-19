-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS get_user_permissions(uuid);
DROP FUNCTION IF EXISTS check_user_permission(uuid, text, text, text);

-- Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  resource text NOT NULL,
  action text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE(role, resource, action)
);

-- Create user_role_assignments table
CREATE TABLE IF NOT EXISTS user_role_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL,
  assigned_at timestamptz DEFAULT now(),
  assigned_by uuid REFERENCES auth.users(id),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for role_permissions
CREATE POLICY "Admins can manage role permissions"
  ON role_permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Anyone can read role permissions"
  ON role_permissions
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for user_role_assignments
CREATE POLICY "Admins can manage user role assignments"
  ON user_role_assignments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can read their own role assignments"
  ON user_role_assignments
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

-- Insert default role permissions
INSERT INTO role_permissions (role, resource, action)
VALUES
  -- Admin permissions (full access)
  ('admin', '*', '*'),
  
  -- Manager permissions
  ('manager', 'properties', 'read'),
  ('manager', 'properties', 'update'),
  ('manager', 'assets', 'read'),
  ('manager', 'assets', 'create'),
  ('manager', 'assets', 'update'),
  ('manager', 'assets', 'delete'),
  ('manager', 'asset_maintenance', 'read'),
  ('manager', 'asset_maintenance', 'create'),
  ('manager', 'asset_maintenance', 'update'),
  ('manager', 'asset_disposals', 'read'),
  ('manager', 'asset_disposals', 'create'),
  ('manager', 'asset_disposals', 'update'),
  ('manager', 'documents', 'read'),
  ('manager', 'documents', 'create'),
  ('manager', 'documents', 'update'),
  ('manager', 'documents', 'delete'),
  ('manager', 'tasks', 'read'),
  ('manager', 'tasks', 'create'),
  ('manager', 'tasks', 'update'),
  ('manager', 'tasks', 'delete'),
  ('manager', 'rfis', 'read'),
  ('manager', 'rfis', 'create'),
  ('manager', 'rfis', 'update'),
  ('manager', 'submittals', 'read'),
  ('manager', 'submittals', 'create'),
  ('manager', 'submittals', 'update'),
  ('manager', 'transmittals', 'read'),
  ('manager', 'transmittals', 'create'),
  ('manager', 'transmittals', 'update'),
  
  -- Finance permissions
  ('finance', 'properties', 'read'),
  ('finance', 'budgets', 'read'),
  ('finance', 'budgets', 'create'),
  ('finance', 'budgets', 'update'),
  ('finance', 'budget_requests', 'read'),
  ('finance', 'budget_requests', 'create'),
  ('finance', 'budget_requests', 'update'),
  ('finance', 'budget_transfers', 'read'),
  ('finance', 'budget_transfers', 'create'),
  ('finance', 'budget_transfers', 'update'),
  ('finance', 'capex_requests', 'read'),
  ('finance', 'capex_requests', 'create'),
  ('finance', 'capex_requests', 'update'),
  ('finance', 'financial_reports', 'read'),
  ('finance', 'financial_reports', 'create'),
  ('finance', 'financial_reports', 'update'),
  
  -- Viewer permissions (read-only)
  ('viewer', 'properties', 'read'),
  ('viewer', 'assets', 'read'),
  ('viewer', 'asset_maintenance', 'read'),
  ('viewer', 'asset_disposals', 'read'),
  ('viewer', 'budgets', 'read'),
  ('viewer', 'budget_requests', 'read'),
  ('viewer', 'budget_transfers', 'read'),
  ('viewer', 'capex_requests', 'read'),
  ('viewer', 'documents', 'read'),
  ('viewer', 'tasks', 'read'),
  ('viewer', 'rfis', 'read'),
  ('viewer', 'submittals', 'read'),
  ('viewer', 'transmittals', 'read'),
  ('viewer', 'financial_reports', 'read');

-- Create function to check if a user has a specific permission
CREATE OR REPLACE FUNCTION has_permission(
  user_id uuid,
  resource text,
  action text
) RETURNS boolean AS $$
DECLARE
  user_role text;
  has_perm boolean;
BEGIN
  -- Get user's role
  SELECT role INTO user_role FROM profiles WHERE id = user_id;
  
  -- Check if user has the permission
  SELECT EXISTS (
    SELECT 1 FROM role_permissions
    WHERE (role_permissions.role = user_role OR role_permissions.role = '*')
    AND (role_permissions.resource = resource OR role_permissions.resource = '*')
    AND (role_permissions.action = action OR role_permissions.action = '*')
  ) INTO has_perm;
  
  RETURN has_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get all permissions for a user
CREATE OR REPLACE FUNCTION get_user_permissions(
  user_id uuid
) RETURNS TABLE (
  resource text,
  action text
) AS $$
DECLARE
  user_role text;
BEGIN
  -- Get user's role
  SELECT role INTO user_role FROM profiles WHERE id = user_id;
  
  -- Return all permissions for the user's role
  RETURN QUERY
  SELECT role_permissions.resource, role_permissions.action
  FROM role_permissions
  WHERE role_permissions.role = user_role
  OR role_permissions.role = '*';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;