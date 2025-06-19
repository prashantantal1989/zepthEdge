/*
  # Financial Reports Schema

  1. New Tables
    - `financial_reports`
      - `id` (uuid, primary key)
      - `property_id` (uuid, foreign key)
      - `name` (text)
      - `type` (text)
      - `date` (date)
      - `data` (jsonb)
      - `created_at` (timestamptz)
      - `created_by` (uuid, foreign key)
      - `updated_at` (timestamptz)
      - `updated_by` (uuid, foreign key)

  2. Security
    - Enable RLS on `financial_reports` table
    - Add policies for authenticated users to:
      - Read reports for their properties
      - Create new reports
      - Update their own reports
*/

-- Create financial_reports table
CREATE TABLE IF NOT EXISTS financial_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('daily', 'weekly', 'monthly')),
  date date NOT NULL,
  data jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE financial_reports ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read reports for their properties"
  ON financial_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = financial_reports.property_id
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM property_users pu
          WHERE pu.property_id = p.id
          AND pu.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can create reports for their properties"
  ON financial_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = financial_reports.property_id
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM property_users pu
          WHERE pu.property_id = p.id
          AND pu.user_id = auth.uid()
          AND pu.role IN ('admin', 'manager')
        )
      )
    )
  );

CREATE POLICY "Users can update their own reports"
  ON financial_reports
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Create indexes
CREATE INDEX financial_reports_property_id_idx ON financial_reports(property_id);
CREATE INDEX financial_reports_type_date_idx ON financial_reports(type, date);
CREATE INDEX financial_reports_created_by_idx ON financial_reports(created_by);