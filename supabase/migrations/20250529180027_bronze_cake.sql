/*
  # Fix property_users RLS policies

  1. Changes
    - Remove recursive RLS policies on property_users table
    - Add simplified policies that avoid circular dependencies
    - Maintain security while allowing proper access to property assignments

  2. Security
    - Users can read their own property assignments
    - Users can read property assignments for properties they own
    - Admins can manage all property assignments
    - Prevents infinite recursion in policy evaluation
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their own assignments" ON property_users;
DROP POLICY IF EXISTS "Admins can manage property assignments" ON property_users;

-- Create new non-recursive policies
CREATE POLICY "Users can read their own assignments"
ON property_users
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = property_users.property_id
    AND properties.created_by = auth.uid()
  )
);

CREATE POLICY "Admins can manage property assignments"
ON property_users
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