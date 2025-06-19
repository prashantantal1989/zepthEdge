/*
  # Fix property_users RLS policy

  1. Changes
    - Drop existing RLS policies for property_users table that cause recursion
    - Create new simplified policies that avoid recursion:
      - Users can read their own assignments
      - Users can read assignments for properties they own
      - Admins can manage all assignments
  
  2. Security
    - Maintains proper access control
    - Prevents infinite recursion in policy evaluation
    - Preserves existing security model with simplified implementation
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can read their own assignments" ON property_users;
DROP POLICY IF EXISTS "Admins can manage property assignments" ON property_users;

-- Create new non-recursive policies
CREATE POLICY "Users can read their own assignments"
ON property_users
FOR SELECT
TO authenticated
USING (
  -- User can see their own assignments
  user_id = auth.uid() OR
  -- Property owners can see all assignments for their properties
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
);