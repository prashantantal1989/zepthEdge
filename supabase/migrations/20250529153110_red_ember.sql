/*
  # Initial Schema Setup

  1. New Tables
    - `properties`
      - `id` (uuid, primary key)
      - `name` (text)
      - `location` (text) 
      - `address` (text)
      - `phone` (text)
      - `email` (text)
      - `general_manager` (text)
      - `type` (text)
      - `rooms` (integer)
      - `currency_code` (text)
      - `currency_symbol` (text)
      - `currency_name` (text)
      - `budget_utilization` (numeric)
      - `image_url` (text)
      - `created_at` (timestamptz)
      - `created_by` (uuid, foreign key)
      - `updated_at` (timestamptz)
      - `updated_by` (uuid, foreign key)

    - `property_users`
      - `id` (uuid, primary key)
      - `property_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `role` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to:
      - Read properties they have access to
      - Create/update properties they own
      - Read/write property user assignments based on role
*/

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  address text NOT NULL,
  phone text,
  email text,
  general_manager text,
  type text NOT NULL,
  rooms integer NOT NULL,
  currency_code text NOT NULL,
  currency_symbol text NOT NULL,
  currency_name text NOT NULL,
  budget_utilization numeric DEFAULT 0,
  image_url text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Create property_users table
CREATE TABLE IF NOT EXISTS property_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'manager', 'finance', 'viewer')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(property_id, user_id)
);

-- Enable RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_users ENABLE ROW LEVEL SECURITY;

-- Create policies for properties
CREATE POLICY "Users can read properties they have access to"
  ON properties
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM property_users pu
      WHERE pu.property_id = properties.id
      AND pu.user_id = auth.uid()
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

-- Create policies for property_users
CREATE POLICY "Users can read property assignments"
  ON property_users
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_users.property_id
      AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Only admins can modify property assignments"
  ON property_users
  USING (
    EXISTS (
      SELECT 1 FROM property_users pu
      WHERE pu.user_id = auth.uid()
      AND pu.role = 'admin'
    )
  );

-- Create indexes
CREATE INDEX properties_created_by_idx ON properties(created_by);
CREATE INDEX property_users_property_id_idx ON property_users(property_id);
CREATE INDEX property_users_user_id_idx ON property_users(user_id);
CREATE INDEX property_users_role_idx ON property_users(role);