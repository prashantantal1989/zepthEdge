/*
  # Fix property_users RLS policies

  1. Changes
    - Drop all existing policies on property_users table
    - Create new non-recursive policies that avoid circular dependencies
    - Add a public policy for anonymous access to support authentication flows
  
  2. Security
    - Maintain security model while preventing infinite recursion
    - Allow users to view their own assignments
    - Allow property owners to manage assignments for their properties
    - Allow admins to manage all assignments
*/

-- First, drop all existing policies on property_users
DROP POLICY IF EXISTS "Users can view property assignments" ON property_users;
DROP POLICY IF EXISTS "Property owners can manage assignments" ON property_users;
DROP POLICY IF EXISTS "Admins can manage all assignments" ON property_users;
DROP POLICY IF EXISTS "Allow users to access their property mapping" ON property_users;

-- Create a policy for public access (needed for authentication)
CREATE POLICY "Allow users to access their property mapping"
ON property_users
FOR SELECT
TO public
USING (user_id = auth.uid());

-- Create a policy for authenticated users to view their assignments
CREATE POLICY "Users can view property assignments"
ON property_users
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Property owners can manage assignments for their properties
CREATE POLICY "Property owners can manage assignments"
ON property_users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = property_users.property_id
    AND properties.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = property_users.property_id
    AND properties.created_by = auth.uid()
  )
);

-- Admins can manage all assignments
CREATE POLICY "Admins can manage all assignments"
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