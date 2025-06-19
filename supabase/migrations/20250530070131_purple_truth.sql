/*
  # Fix workflow policies

  1. Changes
    - Adds DROP POLICY IF EXISTS statements before creating policies
    - Ensures policies are only created if they don't already exist
*/

-- Drop existing policies if they exist to avoid the "policy already exists" error
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