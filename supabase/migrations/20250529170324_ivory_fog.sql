/*
  # Workflow Templates Schema

  1. New Tables
    - `workflow_templates`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `steps` (jsonb)
      - `created_at` (timestamptz)
      - `created_by` (uuid, foreign key)
      - `updated_at` (timestamptz)
      - `updated_by` (uuid, foreign key)

  2. Security
    - Enable RLS on `workflow_templates` table
    - Add policies for authenticated users to:
      - Read all workflow templates
      - Create new workflow templates (admin only)
      - Update their own workflow templates
*/

-- Create workflow_templates table
CREATE TABLE IF NOT EXISTS workflow_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  steps jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read all workflow templates"
  ON workflow_templates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create workflow templates"
  ON workflow_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

CREATE POLICY "Users can update their own workflow templates"
  ON workflow_templates
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Create indexes
CREATE INDEX workflow_templates_created_by_idx ON workflow_templates(created_by);

-- Insert default workflow templates
INSERT INTO workflow_templates (id, name, description, steps)
VALUES 
  (
    gen_random_uuid(),
    'Simple Approval',
    'Single-level approval by finance director',
    '[{"id":"1","type":"approval","role":"Finance Director","description":"Finance director approval"}]'
  ),
  (
    gen_random_uuid(),
    'Standard Approval',
    'Two-level approval with operations and finance',
    '[{"id":"1","type":"approval","role":"Operations Manager","description":"Operations review and approval"},{"id":"2","type":"approval","role":"Finance Director","description":"Financial approval"}]'
  ),
  (
    gen_random_uuid(),
    'Extended Approval',
    'Three-level approval for high-value items',
    '[{"id":"1","type":"approval","role":"Department Head","description":"Department review"},{"id":"2","type":"approval","role":"Finance Director","description":"Financial review"},{"id":"3","type":"approval","role":"General Manager","description":"Final approval"}]'
  );