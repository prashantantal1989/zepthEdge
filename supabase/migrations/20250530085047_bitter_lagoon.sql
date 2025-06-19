/*
  # Create budget_categories table

  1. New Tables
    - `budget_categories`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `code` (text, not null)
      - `description` (text)
      - `created_at` (timestamp with time zone)
      - `created_by` (uuid, references auth.users)
      - `updated_at` (timestamp with time zone)
      - `updated_by` (uuid, references auth.users)
  2. Security
    - Enable RLS on `budget_categories` table
    - Add policies for authenticated users to read all categories
    - Add policies for admins and finance users to manage categories
*/

-- Create budget categories table
CREATE TABLE IF NOT EXISTS budget_categories (
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
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read budget categories"
  ON budget_categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create budget categories"
  ON budget_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'finance')
    )
  );

CREATE POLICY "Admins can update budget categories"
  ON budget_categories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'finance')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'finance')
    )
  );

CREATE POLICY "Admins can delete budget categories"
  ON budget_categories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'finance')
    )
  );

-- Create indexes
CREATE INDEX budget_categories_name_idx ON budget_categories(name);
CREATE INDEX budget_categories_code_idx ON budget_categories(code);