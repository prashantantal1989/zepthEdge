/*
  # Fix Duplicate Disposal Categories Policies

  This migration safely checks for and creates disposal categories policies
  only if they don't already exist.
*/

-- Only create policies if they don't exist
DO $$ 
BEGIN
  -- Check and create the SELECT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'disposal_categories' 
    AND policyname = 'Anyone can read disposal categories'
  ) THEN
    CREATE POLICY "Anyone can read disposal categories"
      ON disposal_categories
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  -- Check and create the INSERT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'disposal_categories' 
    AND policyname = 'Admins can create disposal categories'
  ) THEN
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
  END IF;

  -- Check and create the UPDATE policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'disposal_categories' 
    AND policyname = 'Admins can update disposal categories'
  ) THEN
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
  END IF;

  -- Check and create the DELETE policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'disposal_categories' 
    AND policyname = 'Admins can delete disposal categories'
  ) THEN
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
  END IF;
END $$;