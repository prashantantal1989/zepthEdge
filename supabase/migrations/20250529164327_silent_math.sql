/*
  # Asset Disposal Management Schema

  1. New Tables
    - `asset_disposals`
      - `id` (uuid, primary key)
      - `property_id` (uuid, foreign key)
      - `asset_type` (text)
      - `asset_description` (text)
      - `asset_tag_id` (text)
      - `net_book_value` (numeric)
      - `disposable_value` (numeric)
      - `quantity` (integer)
      - `vendor` (text)
      - `reason` (text)
      - `status` (text)
      - `workflow_id` (uuid)
      - `current_step` (integer)
      - `created_at` (timestamptz)
      - `created_by` (uuid)
      - `updated_at` (timestamptz)
      - `updated_by` (uuid)

  2. Security
    - Enable RLS on `asset_disposals` table
    - Add policies for authenticated users to:
      - Read disposal requests for their properties
      - Create new disposal requests
      - Update their own disposal requests
*/

-- Create asset_disposals table
CREATE TABLE IF NOT EXISTS asset_disposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  asset_type text NOT NULL,
  asset_description text NOT NULL,
  asset_tag_id text NOT NULL,
  net_book_value numeric NOT NULL,
  disposable_value numeric NOT NULL,
  quantity integer NOT NULL,
  vendor text NOT NULL,
  reason text NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  workflow_id uuid NOT NULL,
  current_step integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE asset_disposals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read disposal requests for their properties"
  ON asset_disposals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = asset_disposals.property_id
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

CREATE POLICY "Users can create disposal requests"
  ON asset_disposals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = asset_disposals.property_id
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

CREATE POLICY "Users can update their own disposal requests"
  ON asset_disposals
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Create indexes
CREATE INDEX asset_disposals_property_id_idx ON asset_disposals(property_id);
CREATE INDEX asset_disposals_asset_type_idx ON asset_disposals(asset_type);
CREATE INDEX asset_disposals_status_idx ON asset_disposals(status);