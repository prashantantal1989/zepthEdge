/*
  # Fix RLS policies for property_users and properties tables

  1. Changes
    - Fix infinite recursion in RLS policies by using schema-qualified references
    - Update property_users policies to avoid circular references
    - Update properties policies to avoid circular references

  2. Security
    - Maintain the same security model but prevent infinite recursion
    - Users can still only access properties they own or are assigned to
    - Property owners can still see all users assigned to their properties
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Users can read properties they have access to" ON properties;
DROP POLICY IF EXISTS "Users can read their own assignments" ON property_users;
DROP POLICY IF EXISTS "Admins can manage property assignments" ON property_users;

-- Create new policies with schema-qualified references to break recursion

-- Properties table policies
CREATE POLICY "Users can read properties they have access to"
ON properties
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.property_users
    WHERE public.property_users.property_id = properties.id
    AND public.property_users.user_id = auth.uid()
  )
);

-- Property users table policies
CREATE POLICY "Users can read their own assignments"
ON property_users
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE public.properties.id = property_users.property_id
    AND public.properties.created_by = auth.uid()
  )
);

CREATE POLICY "Admins can manage property assignments"
ON property_users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE public.profiles.id = auth.uid()
    AND public.profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE public.profiles.id = auth.uid()
    AND public.profiles.role = 'admin'
  )
);