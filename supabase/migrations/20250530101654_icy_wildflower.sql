/*
  # Fix disposal categories table

  1. New Tables
    - Checks if disposal_categories table exists before creating it
    - Adds proper error handling for policies
  
  2. Security
    - Enables RLS on disposal_categories table
    - Adds policies for different user roles
*/

-- Only create the table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'disposal_categories') THEN
    -- Create disposal categories table
    CREATE TABLE disposal_categories (
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
  END IF;
END $$;

-- Drop existing policies if they exist to avoid conflicts
DO $$ 
BEGIN
  -- Drop the read policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'disposal_categories' 
    AND policyname = 'Anyone can read disposal categories'
  ) THEN
    DROP POLICY "Anyone can read disposal categories" ON disposal_categories;
  END IF;

  -- Drop the create policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'disposal_categories' 
    AND policyname = 'Admins can create disposal categories'
  ) THEN
    DROP POLICY "Admins can create disposal categories" ON disposal_categories;
  END IF;

  -- Drop the update policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'disposal_categories' 
    AND policyname = 'Admins can update disposal categories'
  ) THEN
    DROP POLICY "Admins can update disposal categories" ON disposal_categories;
  END IF;

  -- Drop the delete policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'disposal_categories' 
    AND policyname = 'Admins can delete disposal categories'
  ) THEN
    DROP POLICY "Admins can delete disposal categories" ON disposal_categories;
  END IF;
END $$;

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

-- Create indexes if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'disposal_categories' 
    AND indexname = 'disposal_categories_name_idx'
  ) THEN
    CREATE INDEX disposal_categories_name_idx ON disposal_categories(name);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'disposal_categories' 
    AND indexname = 'disposal_categories_code_idx'
  ) THEN
    CREATE INDEX disposal_categories_code_idx ON disposal_categories(code);
  END IF;
END $$;