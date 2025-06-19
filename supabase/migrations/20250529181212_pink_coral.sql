/*
  # Fix property_users RLS policy recursion

  1. Changes
    - Drop existing policies on property_users table that cause recursion
    - Create a new simplified policy for reading property_users
    - Create a new policy for managing property assignments
  
  2. Problem Solved
    - Fixes the infinite recursion in RLS policies between properties and property_users tables
    - Simplifies the policy logic to avoid circular dependencies
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Users can read their own assignments" ON property_users;
DROP POLICY IF EXISTS "Admins can manage property assignments" ON property_users;
DROP POLICY IF EXISTS "Admins can modify property assignments" ON property_users;

-- Create new non-recursive policies
CREATE POLICY "Users can view property assignments"
ON property_users
FOR SELECT
TO authenticated
USING (
  -- Users can see their own assignments (direct check without recursion)
  user_id = auth.uid()
);

-- Property owners can see and manage assignments for their properties
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

-- Admins can manage all property assignments
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