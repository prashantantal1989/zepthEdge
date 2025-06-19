/*
  # CAPEX Management Schema

  1. New Tables
    - `capex_requests`
      - `id` (uuid, primary key)
      - `property_id` (uuid, foreign key)
      - `budget_id` (uuid, foreign key)
      - `project_name` (text)
      - `category` (text)
      - `budget_reference` (text)
      - `amount` (numeric)
      - `start_date` (date)
      - `end_date` (date)
      - `status` (text)
      - `project_lead` (text)
      - `department` (text)
      - `sub_department` (text)
      - `design_consultant` (text)
      - `main_contractor` (text)
      - `description` (text)
      - `title_area` (text)
      - `remarks` (text)
      - `workflow_id` (uuid)
      - `current_step` (integer)
      - `created_at` (timestamptz)
      - `created_by` (uuid)
      - `updated_at` (timestamptz)
      - `updated_by` (uuid)

  2. Security
    - Enable RLS on `capex_requests` table
    - Add policies for authenticated users to:
      - Read CAPEX requests for their properties
      - Create new CAPEX requests
      - Update their own CAPEX requests
*/

-- Create capex_requests table
CREATE TABLE IF NOT EXISTS capex_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  budget_id uuid NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  project_name text NOT NULL,
  category text NOT NULL,
  budget_reference text NOT NULL,
  amount numeric NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  project_lead text NOT NULL,
  department text NOT NULL,
  sub_department text NOT NULL,
  design_consultant text,
  main_contractor text,
  description text NOT NULL,
  title_area text NOT NULL,
  remarks text,
  workflow_id uuid NOT NULL,
  current_step integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE capex_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read CAPEX requests for their properties"
  ON capex_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = capex_requests.property_id
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

CREATE POLICY "Users can create CAPEX requests"
  ON capex_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = capex_requests.property_id
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM property_users pu
          WHERE pu.property_id = p.id
          AND pu.user_id = auth.uid()
          AND pu.role IN ('admin', 'manager', 'finance')
        )
      )
    )
  );

CREATE POLICY "Users can update their own CAPEX requests"
  ON capex_requests
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Create indexes
CREATE INDEX capex_requests_property_id_idx ON capex_requests(property_id);
CREATE INDEX capex_requests_budget_id_idx ON capex_requests(budget_id);
CREATE INDEX capex_requests_status_idx ON capex_requests(status);
CREATE INDEX capex_requests_category_idx ON capex_requests(category);
CREATE INDEX capex_requests_department_idx ON capex_requests(department);