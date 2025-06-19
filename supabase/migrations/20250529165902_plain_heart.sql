/*
  # Document Collaboration Schema Fix

  This migration creates a helper function to safely create policies only if they don't already exist,
  then creates the document collaboration tables and policies.

  1. New Tables
    - `documents` - Document storage
    - `transmittals` - Document transmittal management
    - `submittals` - Submittal workflow management
    - `rfis` - Request for Information management
    - `tasks` - Task management

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to:
      - Read documents/transmittals/submittals/RFIs/tasks for their properties
      - Create documents/transmittals/submittals/RFIs/tasks for properties they manage
      - Update their own documents/transmittals/submittals/RFIs/tasks
*/

-- Function to safely create policies
CREATE OR REPLACE FUNCTION create_policy_if_not_exists(
  policy_name text,
  table_name text,
  action text,
  roles text[],
  using_expr text DEFAULT NULL,
  check_expr text DEFAULT NULL,
  permissive text DEFAULT 'PERMISSIVE'
) RETURNS void AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = table_name 
    AND policyname = policy_name
  ) THEN
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR %s TO %s %s %s %s',
      policy_name,
      table_name,
      action,
      array_to_string(roles, ','),
      CASE WHEN using_expr IS NOT NULL THEN 'USING (' || using_expr || ')' ELSE '' END,
      CASE WHEN check_expr IS NOT NULL THEN 'WITH CHECK (' || check_expr || ')' ELSE '' END,
      permissive
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create tables if they don't exist
DO $$ 
BEGIN
  -- Create documents table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'documents') THEN
    CREATE TABLE documents (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      name text NOT NULL,
      type text NOT NULL,
      path text NOT NULL,
      size bigint NOT NULL,
      mime_type text NOT NULL,
      metadata jsonb DEFAULT '{}',
      created_at timestamptz DEFAULT now(),
      created_by uuid REFERENCES auth.users(id),
      updated_at timestamptz DEFAULT now(),
      updated_by uuid REFERENCES auth.users(id)
    );

    -- Enable RLS
    ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Create transmittals table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transmittals') THEN
    CREATE TABLE transmittals (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      subject text NOT NULL,
      recipients text[] NOT NULL,
      due_date date NOT NULL,
      notes text,
      status text NOT NULL CHECK (status IN ('draft', 'pending', 'sent', 'acknowledged')),
      workflow_id uuid NOT NULL,
      current_step integer NOT NULL DEFAULT 0,
      created_at timestamptz DEFAULT now(),
      created_by uuid REFERENCES auth.users(id),
      updated_at timestamptz DEFAULT now(),
      updated_by uuid REFERENCES auth.users(id)
    );

    -- Enable RLS
    ALTER TABLE transmittals ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Create submittals table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'submittals') THEN
    CREATE TABLE submittals (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      title text NOT NULL,
      category text NOT NULL,
      description text,
      status text NOT NULL CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
      workflow_id uuid NOT NULL,
      current_step integer NOT NULL DEFAULT 0,
      created_at timestamptz DEFAULT now(),
      created_by uuid REFERENCES auth.users(id),
      updated_at timestamptz DEFAULT now(),
      updated_by uuid REFERENCES auth.users(id)
    );

    -- Enable RLS
    ALTER TABLE submittals ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Create rfis table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rfis') THEN
    CREATE TABLE rfis (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      subject text NOT NULL,
      category text NOT NULL,
      question text NOT NULL,
      assigned_to uuid REFERENCES auth.users(id),
      due_date date NOT NULL,
      status text NOT NULL CHECK (status IN ('open', 'pending', 'answered', 'closed')),
      workflow_id uuid NOT NULL,
      current_step integer NOT NULL DEFAULT 0,
      created_at timestamptz DEFAULT now(),
      created_by uuid REFERENCES auth.users(id),
      updated_at timestamptz DEFAULT now(),
      updated_by uuid REFERENCES auth.users(id)
    );

    -- Enable RLS
    ALTER TABLE rfis ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Create tasks table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks') THEN
    CREATE TABLE tasks (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      title text NOT NULL,
      description text,
      assignee uuid REFERENCES auth.users(id),
      due_date date NOT NULL,
      priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
      status text NOT NULL CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
      created_at timestamptz DEFAULT now(),
      created_by uuid REFERENCES auth.users(id),
      updated_at timestamptz DEFAULT now(),
      updated_by uuid REFERENCES auth.users(id)
    );

    -- Enable RLS
    ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create policies safely using the helper function
SELECT create_policy_if_not_exists(
  'Users can read documents for their properties',
  'documents',
  'SELECT',
  ARRAY['authenticated'],
  'EXISTS (SELECT 1 FROM properties p WHERE p.id = documents.property_id AND (p.created_by = auth.uid() OR EXISTS (SELECT 1 FROM property_users pu WHERE pu.property_id = p.id AND pu.user_id = auth.uid())))'
);

SELECT create_policy_if_not_exists(
  'Users can create documents',
  'documents',
  'INSERT',
  ARRAY['authenticated'],
  NULL,
  'EXISTS (SELECT 1 FROM properties p WHERE p.id = documents.property_id AND (p.created_by = auth.uid() OR EXISTS (SELECT 1 FROM property_users pu WHERE pu.property_id = p.id AND pu.user_id = auth.uid() AND pu.role IN (''admin'', ''manager''))))'
);

SELECT create_policy_if_not_exists(
  'Users can update their own documents',
  'documents',
  'UPDATE',
  ARRAY['authenticated'],
  'created_by = auth.uid()',
  'created_by = auth.uid()'
);

-- Transmittals policies
SELECT create_policy_if_not_exists(
  'Users can read transmittals for their properties',
  'transmittals',
  'SELECT',
  ARRAY['authenticated'],
  'EXISTS (SELECT 1 FROM properties p WHERE p.id = transmittals.property_id AND (p.created_by = auth.uid() OR EXISTS (SELECT 1 FROM property_users pu WHERE pu.property_id = p.id AND pu.user_id = auth.uid())))'
);

SELECT create_policy_if_not_exists(
  'Users can create transmittals',
  'transmittals',
  'INSERT',
  ARRAY['authenticated'],
  NULL,
  'EXISTS (SELECT 1 FROM properties p WHERE p.id = transmittals.property_id AND (p.created_by = auth.uid() OR EXISTS (SELECT 1 FROM property_users pu WHERE pu.property_id = p.id AND pu.user_id = auth.uid() AND pu.role IN (''admin'', ''manager''))))'
);

SELECT create_policy_if_not_exists(
  'Users can update their own transmittals',
  'transmittals',
  'UPDATE',
  ARRAY['authenticated'],
  'created_by = auth.uid()',
  'created_by = auth.uid()'
);

-- Submittals policies
SELECT create_policy_if_not_exists(
  'Users can read submittals for their properties',
  'submittals',
  'SELECT',
  ARRAY['authenticated'],
  'EXISTS (SELECT 1 FROM properties p WHERE p.id = submittals.property_id AND (p.created_by = auth.uid() OR EXISTS (SELECT 1 FROM property_users pu WHERE pu.property_id = p.id AND pu.user_id = auth.uid())))'
);

SELECT create_policy_if_not_exists(
  'Users can create submittals',
  'submittals',
  'INSERT',
  ARRAY['authenticated'],
  NULL,
  'EXISTS (SELECT 1 FROM properties p WHERE p.id = submittals.property_id AND (p.created_by = auth.uid() OR EXISTS (SELECT 1 FROM property_users pu WHERE pu.property_id = p.id AND pu.user_id = auth.uid() AND pu.role IN (''admin'', ''manager''))))'
);

SELECT create_policy_if_not_exists(
  'Users can update their own submittals',
  'submittals',
  'UPDATE',
  ARRAY['authenticated'],
  'created_by = auth.uid()',
  'created_by = auth.uid()'
);

-- RFIs policies
SELECT create_policy_if_not_exists(
  'Users can read RFIs for their properties',
  'rfis',
  'SELECT',
  ARRAY['authenticated'],
  'EXISTS (SELECT 1 FROM properties p WHERE p.id = rfis.property_id AND (p.created_by = auth.uid() OR EXISTS (SELECT 1 FROM property_users pu WHERE pu.property_id = p.id AND pu.user_id = auth.uid())))'
);

SELECT create_policy_if_not_exists(
  'Users can create RFIs',
  'rfis',
  'INSERT',
  ARRAY['authenticated'],
  NULL,
  'EXISTS (SELECT 1 FROM properties p WHERE p.id = rfis.property_id AND (p.created_by = auth.uid() OR EXISTS (SELECT 1 FROM property_users pu WHERE pu.property_id = p.id AND pu.user_id = auth.uid() AND pu.role IN (''admin'', ''manager''))))'
);

SELECT create_policy_if_not_exists(
  'Users can update their own RFIs',
  'rfis',
  'UPDATE',
  ARRAY['authenticated'],
  'created_by = auth.uid()',
  'created_by = auth.uid()'
);

-- Tasks policies
SELECT create_policy_if_not_exists(
  'Users can read tasks for their properties',
  'tasks',
  'SELECT',
  ARRAY['authenticated'],
  'EXISTS (SELECT 1 FROM properties p WHERE p.id = tasks.property_id AND (p.created_by = auth.uid() OR EXISTS (SELECT 1 FROM property_users pu WHERE pu.property_id = p.id AND pu.user_id = auth.uid())))'
);

SELECT create_policy_if_not_exists(
  'Users can create tasks',
  'tasks',
  'INSERT',
  ARRAY['authenticated'],
  NULL,
  'EXISTS (SELECT 1 FROM properties p WHERE p.id = tasks.property_id AND (p.created_by = auth.uid() OR EXISTS (SELECT 1 FROM property_users pu WHERE pu.property_id = p.id AND pu.user_id = auth.uid() AND pu.role IN (''admin'', ''manager''))))'
);

SELECT create_policy_if_not_exists(
  'Users can update their own tasks',
  'tasks',
  'UPDATE',
  ARRAY['authenticated'],
  'created_by = auth.uid()',
  'created_by = auth.uid()'
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS documents_property_id_idx ON documents(property_id);
CREATE INDEX IF NOT EXISTS documents_type_idx ON documents(type);
CREATE INDEX IF NOT EXISTS transmittals_property_id_idx ON transmittals(property_id);
CREATE INDEX IF NOT EXISTS transmittals_status_idx ON transmittals(status);
CREATE INDEX IF NOT EXISTS submittals_property_id_idx ON submittals(property_id);
CREATE INDEX IF NOT EXISTS submittals_category_idx ON submittals(category);
CREATE INDEX IF NOT EXISTS submittals_status_idx ON submittals(status);
CREATE INDEX IF NOT EXISTS rfis_property_id_idx ON rfis(property_id);
CREATE INDEX IF NOT EXISTS rfis_category_idx ON rfis(category);
CREATE INDEX IF NOT EXISTS rfis_status_idx ON rfis(status);
CREATE INDEX IF NOT EXISTS rfis_assigned_to_idx ON rfis(assigned_to);
CREATE INDEX IF NOT EXISTS tasks_property_id_idx ON tasks(property_id);
CREATE INDEX IF NOT EXISTS tasks_assignee_idx ON tasks(assignee);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);
CREATE INDEX IF NOT EXISTS tasks_priority_idx ON tasks(priority);