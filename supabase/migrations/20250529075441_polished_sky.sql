/*
  # Budget and Capex Schema

  1. New Tables
    - `budgets`
      - `id` (uuid, primary key)
      - `property_id` (uuid, foreign key)
      - `category` (text)
      - `code` (text)
      - `name` (text)
      - `amount` (numeric)
      - `status` (text)
      - `created_at` (timestamptz)
      - `created_by` (uuid, foreign key)
      - `updated_at` (timestamptz)
      - `updated_by` (uuid, foreign key)

    - `capex_requests`
      - `id` (uuid, primary key)
      - `property_id` (uuid, foreign key)
      - `budget_id` (uuid, foreign key)
      - `reference_id` (text)
      - `project_name` (text)
      - `department` (text)
      - `sub_department` (text)
      - `project_lead` (text)
      - `design_consultant` (text)
      - `main_contractor` (text)
      - `description` (text)
      - `title_area` (text)
      - `budget_provision` (numeric)
      - `start_date` (date)
      - `end_date` (date)
      - `remarks` (text)
      - `status` (text)
      - `created_at` (timestamptz)
      - `created_by` (uuid, foreign key)
      - `updated_at` (timestamptz)
      - `updated_by` (uuid, foreign key)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  category text NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Create capex_requests table
CREATE TABLE IF NOT EXISTS capex_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  budget_id uuid NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  reference_id text NOT NULL,
  project_name text NOT NULL,
  department text NOT NULL,
  sub_department text NOT NULL,
  project_lead text NOT NULL,
  design_consultant text,
  main_contractor text,
  description text NOT NULL,
  title_area text NOT NULL,
  budget_provision numeric NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  remarks text,
  status text NOT NULL CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE capex_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for budgets
CREATE POLICY "Users can read budgets for their properties"
  ON budgets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = budgets.property_id
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

CREATE POLICY "Users can create budgets for their properties"
  ON budgets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = budgets.property_id
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

-- Create policies for capex_requests
CREATE POLICY "Users can read capex requests for their properties"
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

CREATE POLICY "Users can create capex requests for their properties"
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

-- Create indexes
CREATE INDEX budgets_property_id_idx ON budgets(property_id);
CREATE INDEX budgets_status_idx ON budgets(status);
CREATE INDEX capex_requests_property_id_idx ON capex_requests(property_id);
CREATE INDEX capex_requests_budget_id_idx ON capex_requests(budget_id);
CREATE INDEX capex_requests_status_idx ON capex_requests(status);