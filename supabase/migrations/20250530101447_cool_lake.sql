-- Test migration to verify Supabase connection
CREATE TABLE IF NOT EXISTS connection_test (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Insert a test record
INSERT INTO connection_test (test_message) 
VALUES ('Connection successful at ' || now()::text);

-- Enable RLS
ALTER TABLE connection_test ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow reading the test data
CREATE POLICY "Allow reading connection test data"
  ON connection_test
  FOR SELECT
  TO authenticated
  USING (true);