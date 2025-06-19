/*
  # Fix property_users RLS policies

  1. Changes
    - Remove recursive policies from property_users table
    - Simplify SELECT policy to avoid infinite recursion
    - Update policies to use direct comparisons instead of subqueries where possible

  2. Security
    - Maintain proper access control while avoiding recursive queries
    - Ensure users can still only access their own property assignments
    - Allow property owners to view all assignments for their properties
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their own assignments" ON property_users;
DROP POLICY IF EXISTS "Admins can modify property assignments" ON property_users;

-- Create new simplified policies
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

CREATE POLICY "Admins can modify property assignments"
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