/*
  # Fix property_users RLS policies

  1. Changes
    - Drop existing problematic policies on property_users table
    - Create new simplified policies that avoid recursion:
      - Users can read their own assignments
      - Users can read assignments for properties they own
      - Admins can manage all assignments
  
  2. Security
    - Maintains RLS protection
    - Simplifies policy logic to prevent recursion
    - Preserves existing access control patterns
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can read their own assignments" ON property_users;
DROP POLICY IF EXISTS "Admins can modify property assignments" ON property_users;

-- Create new simplified policies
CREATE POLICY "Users can read their own assignments"
ON property_users
FOR SELECT
TO authenticated
USING (
  -- Direct user match OR property owner match
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = property_users.property_id 
    AND properties.created_by = auth.uid()
  )
);

-- Admin policy for all operations
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