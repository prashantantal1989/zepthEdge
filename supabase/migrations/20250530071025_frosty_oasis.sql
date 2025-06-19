/*
  # Asset Management Tables

  1. New Tables
    - `assets`
      - `id` (uuid, primary key)
      - `property_id` (uuid, foreign key to properties)
      - `name` (text)
      - `type` (text)
      - `category` (text)
      - `tag_id` (text)
      - `serial_number` (text)
      - `purchase_date` (date)
      - `purchase_cost` (numeric)
      - `current_value` (numeric)
      - `location` (text)
      - `status` (text)
      - `condition` (text)
      - `warranty_expiry` (date)
      - `manufacturer` (text)
      - `model` (text)
      - `supplier` (text)
      - `notes` (text)
      - `metadata` (jsonb)
      - `created_at` (timestamptz)
      - `created_by` (uuid)
      - `updated_at` (timestamptz)
      - `updated_by` (uuid)
    
    - `asset_maintenance`
      - `id` (uuid, primary key)
      - `asset_id` (uuid, foreign key to assets)
      - `property_id` (uuid, foreign key to properties)
      - `maintenance_type` (text)
      - `description` (text)
      - `scheduled_date` (date)
      - `completed_date` (date)
      - `cost` (numeric)
      - `performed_by` (text)
      - `status` (text)
      - `notes` (text)
      - `created_at` (timestamptz)
      - `created_by` (uuid)
      - `updated_at` (timestamptz)
      - `updated_by` (uuid)
    
    - `asset_transfers`
      - `id` (uuid, primary key)
      - `asset_id` (uuid, foreign key to assets)
      - `from_property_id` (uuid, foreign key to properties)
      - `to_property_id` (uuid, foreign key to properties)
      - `transfer_date` (date)
      - `reason` (text)
      - `status` (text)
      - `notes` (text)
      - `created_at` (timestamptz)
      - `created_by` (uuid)
      - `updated_at` (timestamptz)
      - `updated_by` (uuid)
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage assets for their properties
*/

-- Create assets table
CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  category text NOT NULL,
  tag_id text,
  serial_number text,
  purchase_date date,
  purchase_cost numeric,
  current_value numeric,
  location text,
  status text NOT NULL CHECK (status IN ('active', 'maintenance', 'disposed', 'transferred')),
  condition text CHECK (condition IN ('new', 'good', 'fair', 'poor')),
  warranty_expiry date,
  manufacturer text,
  model text,
  supplier text,
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Create asset_maintenance table
CREATE TABLE IF NOT EXISTS asset_maintenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  maintenance_type text NOT NULL,
  description text NOT NULL,
  scheduled_date date NOT NULL,
  completed_date date,
  cost numeric,
  performed_by text,
  status text NOT NULL CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Create asset_transfers table
CREATE TABLE IF NOT EXISTS asset_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  from_property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  to_property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  transfer_date date NOT NULL,
  reason text,
  status text NOT NULL CHECK (status IN ('pending', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS assets_property_id_idx ON assets(property_id);
CREATE INDEX IF NOT EXISTS assets_type_idx ON assets(type);
CREATE INDEX IF NOT EXISTS assets_category_idx ON assets(category);
CREATE INDEX IF NOT EXISTS assets_status_idx ON assets(status);
CREATE INDEX IF NOT EXISTS assets_tag_id_idx ON assets(tag_id);

CREATE INDEX IF NOT EXISTS asset_maintenance_asset_id_idx ON asset_maintenance(asset_id);
CREATE INDEX IF NOT EXISTS asset_maintenance_property_id_idx ON asset_maintenance(property_id);
CREATE INDEX IF NOT EXISTS asset_maintenance_status_idx ON asset_maintenance(status);

CREATE INDEX IF NOT EXISTS asset_transfers_asset_id_idx ON asset_transfers(asset_id);
CREATE INDEX IF NOT EXISTS asset_transfers_from_property_id_idx ON asset_transfers(from_property_id);
CREATE INDEX IF NOT EXISTS asset_transfers_to_property_id_idx ON asset_transfers(to_property_id);
CREATE INDEX IF NOT EXISTS asset_transfers_status_idx ON asset_transfers(status);

-- Enable Row Level Security
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_transfers ENABLE ROW LEVEL SECURITY;

-- Create policies for assets
CREATE POLICY "Users can create assets"
  ON assets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM properties p
      WHERE p.id = property_id
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1
          FROM property_users pu
          WHERE pu.property_id = p.id
          AND pu.user_id = auth.uid()
          AND pu.role IN ('admin', 'manager')
        )
      )
    )
  );

CREATE POLICY "Users can read assets for their properties"
  ON assets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM properties p
      WHERE p.id = property_id
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1
          FROM property_users pu
          WHERE pu.property_id = p.id
          AND pu.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can update assets for their properties"
  ON assets
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM properties p
      WHERE p.id = property_id
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1
          FROM property_users pu
          WHERE pu.property_id = p.id
          AND pu.user_id = auth.uid()
          AND pu.role IN ('admin', 'manager')
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM properties p
      WHERE p.id = property_id
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1
          FROM property_users pu
          WHERE pu.property_id = p.id
          AND pu.user_id = auth.uid()
          AND pu.role IN ('admin', 'manager')
        )
      )
    )
  );

CREATE POLICY "Users can delete assets for their properties"
  ON assets
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM properties p
      WHERE p.id = property_id
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1
          FROM property_users pu
          WHERE pu.property_id = p.id
          AND pu.user_id = auth.uid()
          AND pu.role IN ('admin', 'manager')
        )
      )
    )
  );

-- Create policies for asset_maintenance
CREATE POLICY "Users can create asset maintenance records"
  ON asset_maintenance
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM properties p
      WHERE p.id = property_id
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1
          FROM property_users pu
          WHERE pu.property_id = p.id
          AND pu.user_id = auth.uid()
          AND pu.role IN ('admin', 'manager')
        )
      )
    )
  );

CREATE POLICY "Users can read asset maintenance records for their properties"
  ON asset_maintenance
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM properties p
      WHERE p.id = property_id
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1
          FROM property_users pu
          WHERE pu.property_id = p.id
          AND pu.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can update asset maintenance records for their properties"
  ON asset_maintenance
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM properties p
      WHERE p.id = property_id
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1
          FROM property_users pu
          WHERE pu.property_id = p.id
          AND pu.user_id = auth.uid()
          AND pu.role IN ('admin', 'manager')
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM properties p
      WHERE p.id = property_id
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1
          FROM property_users pu
          WHERE pu.property_id = p.id
          AND pu.user_id = auth.uid()
          AND pu.role IN ('admin', 'manager')
        )
      )
    )
  );

-- Create policies for asset_transfers
CREATE POLICY "Users can create asset transfers"
  ON asset_transfers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM properties p
      WHERE p.id = from_property_id
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1
          FROM property_users pu
          WHERE pu.property_id = p.id
          AND pu.user_id = auth.uid()
          AND pu.role IN ('admin', 'manager')
        )
      )
    )
  );

CREATE POLICY "Users can read asset transfers for their properties"
  ON asset_transfers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM properties p
      WHERE (p.id = from_property_id OR p.id = to_property_id)
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1
          FROM property_users pu
          WHERE pu.property_id = p.id
          AND pu.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can update asset transfers for their properties"
  ON asset_transfers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM properties p
      WHERE (p.id = from_property_id OR p.id = to_property_id)
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1
          FROM property_users pu
          WHERE pu.property_id = p.id
          AND pu.user_id = auth.uid()
          AND pu.role IN ('admin', 'manager')
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM properties p
      WHERE (p.id = from_property_id OR p.id = to_property_id)
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1
          FROM property_users pu
          WHERE pu.property_id = p.id
          AND pu.user_id = auth.uid()
          AND pu.role IN ('admin', 'manager')
        )
      )
    )
  );