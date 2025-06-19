/*
  # Create workflows table with proper foreign key references

  1. New Tables
    - `workflows` - Stores workflow instances for various entities
      - `id` (uuid, primary key)
      - `template_id` (uuid, not null)
      - `entity_type` (text, not null)
      - `entity_id` (uuid, not null)
      - `status` (text, not null)
      - `current_step` (integer)
      - `steps_data` (jsonb)
      - `created_at` (timestamptz)
      - `created_by` (uuid)
      - `updated_at` (timestamptz)
      - `updated_by` (uuid)
  
  2. Security
    - Enable RLS on `workflows` table
    - Add policies for authenticated users to create, read, and update workflow instances
*/

-- Create workflows table
CREATE TABLE IF NOT EXISTS workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'completed', 'rejected')),
  current_step integer DEFAULT 0,
  steps_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS workflows_template_id_idx ON workflows(template_id);
CREATE INDEX IF NOT EXISTS workflows_entity_type_idx ON workflows(entity_type);
CREATE INDEX IF NOT EXISTS workflows_entity_id_idx ON workflows(entity_id);
CREATE INDEX IF NOT EXISTS workflows_status_idx ON workflows(status);

-- Enable Row Level Security
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create workflow instances" ON workflows;
DROP POLICY IF EXISTS "Users can read workflow instances" ON workflows;
DROP POLICY IF EXISTS "Users can update workflow instances" ON workflows;

-- Create policies
CREATE POLICY "Users can create workflow instances"
  ON workflows
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- For budget_request
    (entity_type = 'budget_request' AND EXISTS (
      SELECT 1 FROM budget_requests br
      JOIN properties p ON br.property_id = p.id
      WHERE br.id = entity_id
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM property_users pu
          WHERE pu.property_id = p.id
          AND pu.user_id = auth.uid()
          AND pu.role IN ('admin', 'manager', 'finance')
        )
      )
    )) OR
    -- For capex_request
    (entity_type = 'capex_request' AND EXISTS (
      SELECT 1 FROM capex_requests cr
      JOIN properties p ON cr.property_id = p.id
      WHERE cr.id = entity_id
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM property_users pu
          WHERE pu.property_id = p.id
          AND pu.user_id = auth.uid()
          AND pu.role IN ('admin', 'manager', 'finance')
        )
      )
    )) OR
    -- For asset_disposal
    (entity_type = 'asset_disposal' AND EXISTS (
      SELECT 1 FROM asset_disposals ad
      JOIN properties p ON ad.property_id = p.id
      WHERE ad.id = entity_id
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM property_users pu
          WHERE pu.property_id = p.id
          AND pu.user_id = auth.uid()
          AND pu.role IN ('admin', 'manager', 'finance')
        )
      )
    )) OR
    -- For budget_transfer
    (entity_type = 'budget_transfer' AND EXISTS (
      SELECT 1 FROM budget_transfers bt
      JOIN properties p ON bt.property_id = p.id
      WHERE bt.id = entity_id
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM property_users pu
          WHERE pu.property_id = p.id
          AND pu.user_id = auth.uid()
          AND pu.role IN ('admin', 'manager', 'finance')
        )
      )
    )) OR
    -- For rfi
    (entity_type = 'rfi' AND EXISTS (
      SELECT 1 FROM rfis r
      JOIN properties p ON r.property_id = p.id
      WHERE r.id = entity_id
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM property_users pu
          WHERE pu.property_id = p.id
          AND pu.user_id = auth.uid()
          AND pu.role IN ('admin', 'manager')
        )
      )
    )) OR
    -- For submittal
    (entity_type = 'submittal' AND EXISTS (
      SELECT 1 FROM submittals s
      JOIN properties p ON s.property_id = p.id
      WHERE s.id = entity_id
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM property_users pu
          WHERE pu.property_id = p.id
          AND pu.user_id = auth.uid()
          AND pu.role IN ('admin', 'manager')
        )
      )
    )) OR
    -- For transmittal
    (entity_type = 'transmittal' AND EXISTS (
      SELECT 1 FROM transmittals t
      JOIN properties p ON t.property_id = p.id
      WHERE t.id = entity_id
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM property_users pu
          WHERE pu.property_id = p.id
          AND pu.user_id = auth.uid()
          AND pu.role IN ('admin', 'manager')
        )
      )
    ))
  );

CREATE POLICY "Users can read workflow instances"
  ON workflows
  FOR SELECT
  TO authenticated
  USING (
    -- For budget_request
    (entity_type = 'budget_request' AND EXISTS (
      SELECT 1 FROM budget_requests br
      JOIN properties p ON br.property_id = p.id
      WHERE br.id = entity_id
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM property_users pu
          WHERE pu.property_id = p.id
          AND pu.user_id = auth.uid()
        )
      )
    )) OR
    -- For capex_request
    (entity_type = 'capex_request' AND EXISTS (
      SELECT 1 FROM capex_requests cr
      JOIN properties p ON cr.property_id = p.id
      WHERE cr.id = entity_id
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM property_users pu
          WHERE pu.property_id = p.id
          AND pu.user_id = auth.uid()
        )
      )
    )) OR
    -- For asset_disposal
    (entity_type = 'asset_disposal' AND EXISTS (
      SELECT 1 FROM asset_disposals ad
      JOIN properties p ON ad.property_id = p.id
      WHERE ad.id = entity_id
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM property_users pu
          WHERE pu.property_id = p.id
          AND pu.user_id = auth.uid()
        )
      )
    )) OR
    -- For budget_transfer
    (entity_type = 'budget_transfer' AND EXISTS (
      SELECT 1 FROM budget_transfers bt
      JOIN properties p ON bt.property_id = p.id
      WHERE bt.id = entity_id
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM property_users pu
          WHERE pu.property_id = p.id
          AND pu.user_id = auth.uid()
        )
      )
    )) OR
    -- For rfi
    (entity_type = 'rfi' AND EXISTS (
      SELECT 1 FROM rfis r
      JOIN properties p ON r.property_id = p.id
      WHERE r.id = entity_id
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM property_users pu
          WHERE pu.property_id = p.id
          AND pu.user_id = auth.uid()
        )
      )
    )) OR
    -- For submittal
    (entity_type = 'submittal' AND EXISTS (
      SELECT 1 FROM submittals s
      JOIN properties p ON s.property_id = p.id
      WHERE s.id = entity_id
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM property_users pu
          WHERE pu.property_id = p.id
          AND pu.user_id = auth.uid()
        )
      )
    )) OR
    -- For transmittal
    (entity_type = 'transmittal' AND EXISTS (
      SELECT 1 FROM transmittals t
      JOIN properties p ON t.property_id = p.id
      WHERE t.id = entity_id
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM property_users pu
          WHERE pu.property_id = p.id
          AND pu.user_id = auth.uid()
        )
      )
    ))
  );

CREATE POLICY "Users can update workflow instances"
  ON workflows
  FOR UPDATE
  TO authenticated
  USING (
    -- Creator can update
    created_by = auth.uid() OR
    -- For budget_request
    (entity_type = 'budget_request' AND EXISTS (
      SELECT 1 FROM budget_requests br
      JOIN properties p ON br.property_id = p.id
      WHERE br.id = entity_id
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM property_users pu
          WHERE pu.property_id = p.id
          AND pu.user_id = auth.uid()
          AND pu.role IN ('admin', 'manager', 'finance')
        )
      )
    )) OR
    -- For capex_request
    (entity_type = 'capex_request' AND EXISTS (
      SELECT 1 FROM capex_requests cr
      JOIN properties p ON cr.property_id = p.id
      WHERE cr.id = entity_id
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM property_users pu
          WHERE pu.property_id = p.id
          AND pu.user_id = auth.uid()
          AND pu.role IN ('admin', 'manager', 'finance')
        )
      )
    )) OR
    -- For asset_disposal
    (entity_type = 'asset_disposal' AND EXISTS (
      SELECT 1 FROM asset_disposals ad
      JOIN properties p ON ad.property_id = p.id
      WHERE ad.id = entity_id
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM property_users pu
          WHERE pu.property_id = p.id
          AND pu.user_id = auth.uid()
          AND pu.role IN ('admin', 'manager', 'finance')
        )
      )
    )) OR
    -- For budget_transfer
    (entity_type = 'budget_transfer' AND EXISTS (
      SELECT 1 FROM budget_transfers bt
      JOIN properties p ON bt.property_id = p.id
      WHERE bt.id = entity_id
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM property_users pu
          WHERE pu.property_id = p.id
          AND pu.user_id = auth.uid()
          AND pu.role IN ('admin', 'manager', 'finance')
        )
      )
    )) OR
    -- For rfi
    (entity_type = 'rfi' AND EXISTS (
      SELECT 1 FROM rfis r
      JOIN properties p ON r.property_id = p.id
      WHERE r.id = entity_id
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM property_users pu
          WHERE pu.property_id = p.id
          AND pu.user_id = auth.uid()
          AND pu.role IN ('admin', 'manager')
        )
      )
    )) OR
    -- For submittal
    (entity_type = 'submittal' AND EXISTS (
      SELECT 1 FROM submittals s
      JOIN properties p ON s.property_id = p.id
      WHERE s.id = entity_id
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM property_users pu
          WHERE pu.property_id = p.id
          AND pu.user_id = auth.uid()
          AND pu.role IN ('admin', 'manager')
        )
      )
    )) OR
    -- For transmittal
    (entity_type = 'transmittal' AND EXISTS (
      SELECT 1 FROM transmittals t
      JOIN properties p ON t.property_id = p.id
      WHERE t.id = entity_id
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM property_users pu
          WHERE pu.property_id = p.id
          AND pu.user_id = auth.uid()
          AND pu.role IN ('admin', 'manager')
        )
      )
    ))
  )
  WITH CHECK (
    -- Creator can update
    created_by = auth.uid() OR
    -- For budget_request
    (entity_type = 'budget_request' AND EXISTS (
      SELECT 1 FROM budget_requests br
      JOIN properties p ON br.property_id = p.id
      WHERE br.id = entity_id
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM property_users pu
          WHERE pu.property_id = p.id
          AND pu.user_id = auth.uid()
          AND pu.role IN ('admin', 'manager', 'finance')
        )
      )
    )) OR
    -- For capex_request
    (entity_type = 'capex_request' AND EXISTS (
      SELECT 1 FROM capex_requests cr
      JOIN properties p ON cr.property_id = p.id
      WHERE cr.id = entity_id
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM property_users pu
          WHERE pu.property_id = p.id
          AND pu.user_id = auth.uid()
          AND pu.role IN ('admin', 'manager', 'finance')
        )
      )
    )) OR
    -- For asset_disposal
    (entity_type = 'asset_disposal' AND EXISTS (
      SELECT 1 FROM asset_disposals ad
      JOIN properties p ON ad.property_id = p.id
      WHERE ad.id = entity_id
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM property_users pu
          WHERE pu.property_id = p.id
          AND pu.user_id = auth.uid()
          AND pu.role IN ('admin', 'manager', 'finance')
        )
      )
    )) OR
    -- For budget_transfer
    (entity_type = 'budget_transfer' AND EXISTS (
      SELECT 1 FROM budget_transfers bt
      JOIN properties p ON bt.property_id = p.id
      WHERE bt.id = entity_id
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM property_users pu
          WHERE pu.property_id = p.id
          AND pu.user_id = auth.uid()
          AND pu.role IN ('admin', 'manager', 'finance')
        )
      )
    )) OR
    -- For rfi
    (entity_type = 'rfi' AND EXISTS (
      SELECT 1 FROM rfis r
      JOIN properties p ON r.property_id = p.id
      WHERE r.id = entity_id
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM property_users pu
          WHERE pu.property_id = p.id
          AND pu.user_id = auth.uid()
          AND pu.role IN ('admin', 'manager')
        )
      )
    )) OR
    -- For submittal
    (entity_type = 'submittal' AND EXISTS (
      SELECT 1 FROM submittals s
      JOIN properties p ON s.property_id = p.id
      WHERE s.id = entity_id
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM property_users pu
          WHERE pu.property_id = p.id
          AND pu.user_id = auth.uid()
          AND pu.role IN ('admin', 'manager')
        )
      )
    )) OR
    -- For transmittal
    (entity_type = 'transmittal' AND EXISTS (
      SELECT 1 FROM transmittals t
      JOIN properties p ON t.property_id = p.id
      WHERE t.id = entity_id
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM property_users pu
          WHERE pu.property_id = p.id
          AND pu.user_id = auth.uid()
          AND pu.role IN ('admin', 'manager')
        )
      )
    ))
  );