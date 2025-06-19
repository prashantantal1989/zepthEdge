/*
  # Create disposal categories table

  1. New Tables
    - `disposal_categories`
      - `id` (uuid, primary key)
      - `name` (text)
      - `code` (text)
      - `description` (text, nullable)
      - `created_at` (timestamp)
      - `created_by` (uuid, references auth.users)
      - `updated_at` (timestamp)
      - `updated_by` (uuid, references auth.users)
  2. Security
    - Enable RLS on `disposal_categories` table
    - Add policies for reading, creating, updating, and deleting categories
*/

-- Create disposal categories table
CREATE TABLE IF NOT EXISTS disposal_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE disposal_categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read disposal categories"
  ON disposal_categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create disposal categories"
  ON disposal_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins can update disposal categories"
  ON disposal_categories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins can delete disposal categories"
  ON disposal_categories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- Create indexes
CREATE INDEX disposal_categories_name_idx ON disposal_categories(name);
CREATE INDEX disposal_categories_code_idx ON disposal_categories(code);