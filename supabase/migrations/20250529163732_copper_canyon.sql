/*
  # Budget Management Schema

  1. New Tables
    - `budgets`
      - `id` (uuid, primary key)
      - `property_id` (uuid, foreign key)
      - `category` (text)
      - `code` (text)
      - `total_budget` (numeric)
      - `utilized_budget` (numeric)
      - `year` (integer)
      - `created_at` (timestamptz)
      - `created_by` (uuid, foreign key)
      - `updated_at` (timestamptz)
      - `updated_by` (uuid, foreign key)

    - `budget_requests`
      - `id` (uuid, primary key)
      - `property_id` (uuid, foreign key)
      - `budget_id` (uuid, foreign key)
      - `title` (text)
      - `description` (text)
      - `amount` (numeric)
      - `status` (text)
      - `workflow_id` (uuid)
      - `current_step` (integer)
      - `created_at` (timestamptz)
      - `created_by` (uuid, foreign key)
      - `updated_at` (timestamptz)
      - `updated_by` (uuid, foreign key)

    - `budget_transfers`
      - `id` (uuid, primary key)
      - `property_id` (uuid, foreign key)
      - `from_budget_id` (uuid, foreign key)
      - `to_budget_id` (uuid, foreign key)
      - `amount` (numeric)
      - `reason` (text)
      - `status` (text)
      - `workflow_id` (uuid)
      - `current_step` (integer)
      - `created_at` (timestamptz)
      - `created_by` (uuid, foreign key)
      - `updated_at` (timestamptz)
      - `updated_by` (uuid, foreign key)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to:
      - Read budgets for their properties
      - Create and update budget requests
      - Create and update budget transfers
*/

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  category text NOT NULL,
  code text NOT NULL,
  total_budget numeric NOT NULL DEFAULT 0,
  utilized_budget numeric NOT NULL DEFAULT 0,
  year integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Create budget_requests table
CREATE TABLE IF NOT EXISTS budget_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  budget_id uuid NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  amount numeric NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  workflow_id uuid NOT NULL,
  current_step integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Create budget_transfers table
CREATE TABLE IF NOT EXISTS budget_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  from_budget_id uuid NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  to_budget_id uuid NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  reason text,
  status text NOT NULL CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  workflow_id uuid NOT NULL,
  current_step integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_transfers ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Users can update budgets for their properties"
  ON budgets
  FOR UPDATE
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
          AND pu.role IN ('admin', 'manager', 'finance')
        )
      )
    )
  );

-- Create policies for budget_requests
CREATE POLICY "Users can read budget requests for their properties"
  ON budget_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = budget_requests.property_id
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

CREATE POLICY "Users can create budget requests"
  ON budget_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = budget_requests.property_id
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

CREATE POLICY "Users can update their own budget requests"
  ON budget_requests
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Create policies for budget_transfers
CREATE POLICY "Users can read budget transfers for their properties"
  ON budget_transfers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = budget_transfers.property_id
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

CREATE POLICY "Users can create budget transfers"
  ON budget_transfers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = budget_transfers.property_id
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

CREATE POLICY "Users can update their own budget transfers"
  ON budget_transfers
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Create indexes
CREATE INDEX budgets_property_id_idx ON budgets(property_id);
CREATE INDEX budgets_category_idx ON budgets(category);
CREATE INDEX budgets_year_idx ON budgets(year);
CREATE INDEX budget_requests_property_id_idx ON budget_requests(property_id);
CREATE INDEX budget_requests_budget_id_idx ON budget_requests(budget_id);
CREATE INDEX budget_requests_status_idx ON budget_requests(status);
CREATE INDEX budget_transfers_property_id_idx ON budget_transfers(property_id);
CREATE INDEX budget_transfers_from_budget_id_idx ON budget_transfers(from_budget_id);
CREATE INDEX budget_transfers_to_budget_id_idx ON budget_transfers(to_budget_id);
CREATE INDEX budget_transfers_status_idx ON budget_transfers(status);