/*
  # Fix RLS recursion in properties table

  This migration updates the RLS policies to prevent infinite recursion
  when checking access to properties.

  1. Changes
    - Simplify property access policies to avoid circular references
    - Remove joins that could cause recursion
    - Use EXISTS subqueries instead of JOINs for access checks

  2. Security
    - Maintains existing access control rules
    - Users can still only access properties they own or are assigned to
    - Property owners retain full control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read properties they have access to" ON properties;
DROP POLICY IF EXISTS "Users can create properties" ON properties;
DROP POLICY IF EXISTS "Users can update their own properties" ON properties;

-- Create new, simplified policies
CREATE POLICY "Users can read properties they have access to"
ON properties
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM property_users
    WHERE property_users.property_id = properties.id
    AND property_users.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create properties"
ON properties
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update their own properties"
ON properties
FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());