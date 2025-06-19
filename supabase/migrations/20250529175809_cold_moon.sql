/*
  # Fix property_users RLS policies

  1. Changes
    - Remove recursive policy for property_users table
    - Add simplified policies that avoid circular references:
      - Users can read their own property assignments
      - Property owners can read assignments for their properties
      - Only admins can modify property assignments
  
  2. Security
    - Maintains proper access control without recursion
    - Ensures users can only see relevant property assignments
    - Preserves admin-only modification rights
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Only admins can modify property assignments" ON property_users;
DROP POLICY IF EXISTS "Users can read property assignments" ON property_users;

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