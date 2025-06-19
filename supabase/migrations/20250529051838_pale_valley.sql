/*
  # User Roles and Permissions Schema

  1. New Tables
    - `roles`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `approval_limit` (numeric)
      - `created_at` (timestamptz)
    
    - `user_roles`
      - `id` (uuid, primary key) 
      - `user_id` (uuid, foreign key)
      - `role_id` (uuid, foreign key)
      - `property_id` (uuid, foreign key)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for role-based access
*/

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  approval_limit numeric,
  created_at timestamptz DEFAULT now()
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role_id, property_id)
);

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can read roles"
  ON roles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify roles"
  ON roles
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role_id IN (
        SELECT id FROM roles WHERE name = 'admin'
      )
    )
  );

CREATE POLICY "Users can read their own roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Only admins can modify user roles"
  ON user_roles
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role_id IN (
        SELECT id FROM roles WHERE name = 'admin'
      )
    )
  );

-- Create indexes
CREATE INDEX roles_name_idx ON roles(name);
CREATE INDEX user_roles_user_id_idx ON user_roles(user_id);
CREATE INDEX user_roles_role_id_idx ON user_roles(role_id);
CREATE INDEX user_roles_property_id_idx ON user_roles(property_id);

-- Insert default roles
INSERT INTO roles (name, description, approval_limit) VALUES
('admin', 'System administrator with full access', NULL),
('property_manager', 'Property manager with full property access', 100000),
('finance_manager', 'Finance manager with budget approval rights', 50000),
('operations_manager', 'Operations manager with operational approval rights', 25000),
('staff', 'Regular staff member with basic access', 1000);