/*
  # Document Collaboration Schema

  1. New Tables
    - `documents`
      - `id` (uuid, primary key)
      - `property_id` (uuid, references properties)
      - `name` (text)
      - `type` (text)
      - `path` (text)
      - `size` (bigint)
      - `mime_type` (text)
      - `metadata` (jsonb)
      - Timestamps and user tracking

    - `transmittals`
      - `id` (uuid, primary key)
      - `property_id` (uuid, references properties)
      - `subject` (text)
      - `recipients` (text[])
      - `due_date` (date)
      - `notes` (text)
      - `status` (text)
      - `workflow_id` (uuid)
      - `current_step` (integer)
      - Timestamps and user tracking

    - `submittals`
      - `id` (uuid, primary key)
      - `property_id` (uuid, references properties)
      - `title` (text)
      - `category` (text)
      - `description` (text)
      - `status` (text)
      - `workflow_id` (uuid)
      - `current_step` (integer)
      - Timestamps and user tracking

    - `rfis`
      - `id` (uuid, primary key)
      - `property_id` (uuid, references properties)
      - `subject` (text)
      - `category` (text)
      - `question` (text)
      - `assigned_to` (uuid, references users)
      - `due_date` (date)
      - `status` (text)
      - `workflow_id` (uuid)
      - `current_step` (integer)
      - Timestamps and user tracking

    - `tasks`
      - `id` (uuid, primary key)
      - `property_id` (uuid, references properties)
      - `title` (text)
      - `description` (text)
      - `assignee` (uuid, references users)
      - `due_date` (date)
      - `priority` (text)
      - `status` (text)
      - Timestamps and user tracking

  2. Security
    - Enable RLS on all tables
    - Add policies for CRUD operations based on property access
    - Ensure proper cascading deletes

  3. Indexes
    - Add indexes for frequently queried columns
    - Add indexes for foreign keys
*/

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  path text NOT NULL,
  size bigint NOT NULL,
  mime_type text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS documents_property_id_idx ON documents(property_id);
CREATE INDEX IF NOT EXISTS documents_type_idx ON documents(type);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create documents"
  ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM properties p
    WHERE p.id = property_id 
    AND (
      p.created_by = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM property_users pu
        WHERE pu.property_id = p.id 
        AND pu.user_id = auth.uid()
        AND pu.role IN ('admin', 'manager')
      )
    )
  ));

CREATE POLICY "Users can read documents for their properties"
  ON documents
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM properties p
    WHERE p.id = property_id 
    AND (
      p.created_by = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM property_users pu
        WHERE pu.property_id = p.id 
        AND pu.user_id = auth.uid()
      )
    )
  ));

CREATE POLICY "Users can update their own documents"
  ON documents
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Transmittals table
CREATE TABLE IF NOT EXISTS transmittals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  subject text NOT NULL,
  recipients text[] NOT NULL,
  due_date date NOT NULL,
  notes text,
  status text NOT NULL CHECK (status IN ('draft', 'pending', 'sent', 'acknowledged')),
  workflow_id uuid NOT NULL,
  current_step integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS transmittals_property_id_idx ON transmittals(property_id);
CREATE INDEX IF NOT EXISTS transmittals_status_idx ON transmittals(status);

ALTER TABLE transmittals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create transmittals"
  ON transmittals
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM properties p
    WHERE p.id = property_id 
    AND (
      p.created_by = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM property_users pu
        WHERE pu.property_id = p.id 
        AND pu.user_id = auth.uid()
        AND pu.role IN ('admin', 'manager')
      )
    )
  ));

CREATE POLICY "Users can read transmittals for their properties"
  ON transmittals
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM properties p
    WHERE p.id = property_id 
    AND (
      p.created_by = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM property_users pu
        WHERE pu.property_id = p.id 
        AND pu.user_id = auth.uid()
      )
    )
  ));

CREATE POLICY "Users can update their own transmittals"
  ON transmittals
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Submittals table
CREATE TABLE IF NOT EXISTS submittals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL,
  description text,
  status text NOT NULL CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  workflow_id uuid NOT NULL,
  current_step integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS submittals_property_id_idx ON submittals(property_id);
CREATE INDEX IF NOT EXISTS submittals_category_idx ON submittals(category);
CREATE INDEX IF NOT EXISTS submittals_status_idx ON submittals(status);

ALTER TABLE submittals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create submittals"
  ON submittals
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM properties p
    WHERE p.id = property_id 
    AND (
      p.created_by = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM property_users pu
        WHERE pu.property_id = p.id 
        AND pu.user_id = auth.uid()
        AND pu.role IN ('admin', 'manager')
      )
    )
  ));

CREATE POLICY "Users can read submittals for their properties"
  ON submittals
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM properties p
    WHERE p.id = property_id 
    AND (
      p.created_by = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM property_users pu
        WHERE pu.property_id = p.id 
        AND pu.user_id = auth.uid()
      )
    )
  ));

CREATE POLICY "Users can update their own submittals"
  ON submittals
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- RFIs table
CREATE TABLE IF NOT EXISTS rfis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  subject text NOT NULL,
  category text NOT NULL,
  question text NOT NULL,
  assigned_to uuid REFERENCES users(id),
  due_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('open', 'pending', 'answered', 'closed')),
  workflow_id uuid NOT NULL,
  current_step integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS rfis_property_id_idx ON rfis(property_id);
CREATE INDEX IF NOT EXISTS rfis_category_idx ON rfis(category);
CREATE INDEX IF NOT EXISTS rfis_status_idx ON rfis(status);
CREATE INDEX IF NOT EXISTS rfis_assigned_to_idx ON rfis(assigned_to);

ALTER TABLE rfis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create RFIs"
  ON rfis
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM properties p
    WHERE p.id = property_id 
    AND (
      p.created_by = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM property_users pu
        WHERE pu.property_id = p.id 
        AND pu.user_id = auth.uid()
        AND pu.role IN ('admin', 'manager')
      )
    )
  ));

CREATE POLICY "Users can read RFIs for their properties"
  ON rfis
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM properties p
    WHERE p.id = property_id 
    AND (
      p.created_by = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM property_users pu
        WHERE pu.property_id = p.id 
        AND pu.user_id = auth.uid()
      )
    )
  ));

CREATE POLICY "Users can update their own RFIs"
  ON rfis
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  assignee uuid REFERENCES users(id),
  due_date date NOT NULL,
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  status text NOT NULL CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS tasks_property_id_idx ON tasks(property_id);
CREATE INDEX IF NOT EXISTS tasks_assignee_idx ON tasks(assignee);
CREATE INDEX IF NOT EXISTS tasks_priority_idx ON tasks(priority);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create tasks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM properties p
    WHERE p.id = property_id 
    AND (
      p.created_by = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM property_users pu
        WHERE pu.property_id = p.id 
        AND pu.user_id = auth.uid()
        AND pu.role IN ('admin', 'manager')
      )
    )
  ));

CREATE POLICY "Users can read tasks for their properties"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM properties p
    WHERE p.id = property_id 
    AND (
      p.created_by = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM property_users pu
        WHERE pu.property_id = p.id 
        AND pu.user_id = auth.uid()
      )
    )
  ));

CREATE POLICY "Users can update their own tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());