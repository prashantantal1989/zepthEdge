-- Order of table creation:
-- 1. users (already exists, but referenced by many tables)
-- 2. workflow_templates
-- 3. properties
-- 4. roles / role_permissions (defining new as per prompt, as not found in migrations)
-- 5. user_role_assignments (defining new)
-- 6. property_users
-- 7. budgets
-- 8. financial_reports
-- 9. capex_requests
-- 10. assets
-- 11. asset_maintenance
-- 12. asset_transfers
-- 13. asset_disposals
-- 14. documents
-- 15. transmittals
-- 16. submittals
-- 17. rfis
-- 18. tasks
-- 19. workflows (references many tables including workflow_templates)
-- 20. Help Center tables (help_categories first)

-- Ensure this is run after the initial users table is created by database.ts
-- The users table structure (from previous subtask):
-- id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
-- email TEXT UNIQUE NOT NULL,
-- password_hash TEXT NOT NULL,
-- full_name TEXT,
-- avatar_url TEXT,
-- role TEXT DEFAULT 'viewer', -- This is the general system role
-- created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
-- updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP

-- Function to update updated_at timestamp (already created in database.ts, shown for completeness)
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   NEW.updated_at = CURRENT_TIMESTAMP;
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- Workflow Templates Table (as per 20250529170324_ivory_fog.sql and prompt)
CREATE TABLE IF NOT EXISTS workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- Added based on prompt's reference to WorkflowTemplate type
  steps JSONB NOT NULL DEFAULT '[]'::jsonb, -- e.g., '[{"name": "Step 1", "description": "Initial Review", "approver_role": "manager"}]'
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE TRIGGER update_workflow_templates_updated_at
BEFORE UPDATE ON workflow_templates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Properties Table (as per 20250529153110_red_ember.sql)
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  general_manager TEXT,
  type TEXT NOT NULL, -- e.g., 'Hotel', 'Resort'
  rooms INTEGER NOT NULL,
  currency_code TEXT NOT NULL,
  currency_symbol TEXT NOT NULL,
  currency_name TEXT NOT NULL,
  budget_utilization NUMERIC DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE TRIGGER update_properties_updated_at
BEFORE UPDATE ON properties
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Role Permissions Table (New, based on prompt)
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL UNIQUE, -- e.g., 'admin', 'property_manager', 'finance_viewer'
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g. {"capex_requests": ["create", "read", "update"], "budgets": ["read"]}
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE TRIGGER update_role_permissions_updated_at
BEFORE UPDATE ON role_permissions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- User Role Assignments Table (New, based on prompt)
CREATE TABLE IF NOT EXISTS user_role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL REFERENCES role_permissions(role) ON DELETE CASCADE, -- General system/application role
  assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  assigned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  UNIQUE(user_id, role) -- A user can have a specific role only once
);
-- No updated_at needed here as assignments are typically point-in-time, or new row is created.

-- Property Users Table (as per 20250529153110_red_ember.sql)
CREATE TABLE IF NOT EXISTS property_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- Property-specific role, e.g., 'Property Admin', 'Maintenance Head', 'Viewer'
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(property_id, user_id, role) -- User can have multiple roles for a property, or just one depending on needs. For now, unique with role.
);
-- No updated_at needed here.

-- Budgets Table (as per 20250529163732_copper_canyon.sql)
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  code TEXT NOT NULL, -- Budget code or GL code
  name TEXT, -- Added from 20250529075441_polished_sky.sql for clarity
  total_budget NUMERIC NOT NULL DEFAULT 0,
  utilized_budget NUMERIC NOT NULL DEFAULT 0,
  year INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'active', 'closed')), -- Added more statuses
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE TRIGGER update_budgets_updated_at
BEFORE UPDATE ON budgets
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Financial Reports Table (as per 20250528100216_warm_frost.sql)
CREATE TABLE IF NOT EXISTS financial_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'monthly', 'quarterly', 'annual', 'custom')), -- Expanded types
  date DATE NOT NULL,
  data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE TRIGGER update_financial_reports_updated_at
BEFORE UPDATE ON financial_reports
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Capex Requests Table (as per 20250529164152_pink_cake.sql, with elements from 20250529075441_polished_sky.sql)
CREATE TABLE IF NOT EXISTS capex_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  budget_id UUID REFERENCES budgets(id) ON DELETE SET NULL, -- Can be optional initially
  reference_id TEXT, -- Kept from polished_sky, might be useful
  project_name TEXT NOT NULL,
  category TEXT NOT NULL, -- Added from pink_cake
  budget_reference TEXT, -- Kept from pink_cake (e.g. line item)
  amount NUMERIC NOT NULL, -- Kept from pink_cake (budget_provision from polished_sky is similar)
  department TEXT NOT NULL,
  sub_department TEXT, -- Made optional
  project_lead TEXT NOT NULL,
  design_consultant TEXT,
  main_contractor TEXT,
  description TEXT NOT NULL,
  title_area TEXT, -- Made optional
  start_date DATE, -- Made optional
  end_date DATE, -- Made optional
  remarks TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'in_progress', 'completed', 'on_hold', 'cancelled')), -- Expanded statuses
  workflow_id UUID, -- Will be FK to workflows table later
  current_step INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE TRIGGER update_capex_requests_updated_at
BEFORE UPDATE ON capex_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Assets Table (as per 20250530071025_frosty_oasis.sql)
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  tag_id TEXT UNIQUE, -- Assuming asset tags are unique across all assets
  serial_number TEXT,
  purchase_date DATE,
  purchase_cost NUMERIC,
  current_value NUMERIC,
  location TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'maintenance', 'disposed', 'transferred', 'out_of_service')),
  condition TEXT CHECK (condition IN ('new', 'good', 'fair', 'poor', 'needs_repair')),
  warranty_expiry DATE,
  manufacturer TEXT,
  model TEXT,
  supplier TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE TRIGGER update_assets_updated_at
BEFORE UPDATE ON assets
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Asset Maintenance Table (as per 20250530071025_frosty_oasis.sql)
CREATE TABLE IF NOT EXISTS asset_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE, -- Denormalized for easier property-level queries
  maintenance_type TEXT NOT NULL, -- e.g., 'preventive', 'corrective', 'inspection'
  description TEXT NOT NULL,
  scheduled_date DATE,
  completed_date DATE,
  cost NUMERIC,
  performed_by TEXT, -- Could be internal staff name or external vendor
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'deferred')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE TRIGGER update_asset_maintenance_updated_at
BEFORE UPDATE ON asset_maintenance
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Asset Transfers Table (as per 20250530071025_frosty_oasis.sql)
CREATE TABLE IF NOT EXISTS asset_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  from_property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  to_property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  transfer_date DATE NOT NULL,
  reason TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'cancelled', 'in_transit')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  CONSTRAINT check_different_properties CHECK (from_property_id <> to_property_id)
);

CREATE TRIGGER update_asset_transfers_updated_at
BEFORE UPDATE ON asset_transfers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Asset Disposals Table (as per 20250529164327_silent_math.sql)
CREATE TABLE IF NOT EXISTS asset_disposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE, -- Link to the specific asset being disposed
  asset_type TEXT NOT NULL, -- e.g., 'Furniture', 'Equipment', 'IT Hardware'
  asset_description TEXT NOT NULL,
  asset_tag_id TEXT, -- Copied from asset, or entered if asset not in DB
  net_book_value NUMERIC, -- Made optional
  disposable_value NUMERIC, -- Expected sale or scrap value, made optional
  quantity INTEGER NOT NULL DEFAULT 1,
  vendor TEXT, -- If sold to a vendor
  reason TEXT NOT NULL, -- e.g., 'damaged', 'obsolete', 'sold'
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'completed', 'cancelled')),
  workflow_id UUID, -- Link to workflows table
  current_step INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE TRIGGER update_asset_disposals_updated_at
BEFORE UPDATE ON asset_disposals
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Documents Table (as per 20250529172646_bronze_stream.sql or similar)
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE, -- Optional if document is not property specific
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- e.g., 'Contract', 'Invoice', 'Manual', 'Drawing'
  path TEXT NOT NULL, -- Storage path, e.g., S3 key
  size BIGINT, -- Made optional, in bytes
  mime_type TEXT, -- Made optional
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Transmittals Table (as per 20250529172646_bronze_stream.sql or similar)
CREATE TABLE IF NOT EXISTS transmittals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE, -- Optional if not property specific
  subject TEXT NOT NULL,
  recipients TEXT[] NOT NULL, -- Array of email addresses or user IDs
  due_date DATE, -- Made optional
  notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending', 'sent', 'acknowledged', 'overdue', 'cancelled')),
  workflow_id UUID, -- Link to workflows table
  current_step INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE TRIGGER update_transmittals_updated_at
BEFORE UPDATE ON transmittals
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Submittals Table (as per 20250529172646_bronze_stream.sql or similar)
CREATE TABLE IF NOT EXISTS submittals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE, -- Optional
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- e.g., 'Shop Drawing', 'Material Sample', 'Report'
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected', 'resubmit', 'cancelled')),
  workflow_id UUID, -- Link to workflows table
  current_step INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE TRIGGER update_submittals_updated_at
BEFORE UPDATE ON submittals
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RFIs (Request For Information) Table (as per 20250529172646_bronze_stream.sql or similar)
CREATE TABLE IF NOT EXISTS rfis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE, -- Optional
  subject TEXT NOT NULL,
  category TEXT NOT NULL, -- e.g., 'Technical Query', 'Design Clarification'
  question TEXT NOT NULL,
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  due_date DATE,
  status TEXT NOT NULL CHECK (status IN ('open', 'pending_response', 'answered', 'closed', 'cancelled')),
  workflow_id UUID, -- Link to workflows table
  current_step INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE TRIGGER update_rfis_updated_at
BEFORE UPDATE ON rfis
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tasks Table (as per 20250529172646_bronze_stream.sql or similar)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE, -- Optional, task might be system-wide
  title TEXT NOT NULL,
  description TEXT,
  assignee_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  due_date DATE,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL CHECK (status IN ('todo', 'in_progress', 'review', 'done', 'blocked', 'cancelled')),
  related_entity_type TEXT, -- e.g., 'capex_request', 'document'
  related_entity_id UUID,   -- FK to the related entity
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Workflows Table (as per 20250530070630_falling_lantern.sql, ensuring FKs are correct)
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES workflow_templates(id) ON DELETE RESTRICT, -- Ensure template exists
  entity_type TEXT NOT NULL, -- e.g., 'capex_request', 'asset_disposal', 'submittal'
  entity_id UUID NOT NULL,   -- This will be the ID of the capex_request, asset_disposal, etc.
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'rejected', 'cancelled', 'pending_start')),
  current_step INTEGER DEFAULT 0,
  steps_data JSONB NOT NULL DEFAULT '[]'::jsonb, -- Stores current state of each step: { step_id: "...", name: "...", status: "pending/approved/rejected", approver_role: "...", approver_user_id: "...", comments: "...", approved_at: "timestamp" }
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
  -- Add a unique constraint for entity_type and entity_id to ensure one active workflow per entity if needed
  -- UNIQUE(entity_type, entity_id) WHERE status = 'active' -- This might need a partial index or more complex logic
);

-- Add foreign key constraints from other tables to workflows.id if they have workflow_id
ALTER TABLE capex_requests ADD CONSTRAINT fk_capex_requests_workflow FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE SET NULL;
ALTER TABLE asset_disposals ADD CONSTRAINT fk_asset_disposals_workflow FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE SET NULL;
ALTER TABLE transmittals ADD CONSTRAINT fk_transmittals_workflow FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE SET NULL;
ALTER TABLE submittals ADD CONSTRAINT fk_submittals_workflow FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE SET NULL;
ALTER TABLE rfis ADD CONSTRAINT fk_rfis_workflow FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE SET NULL;
-- Budget requests and transfers also had workflow_id in some migrations
-- ALTER TABLE budget_requests ADD COLUMN workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL;
-- ALTER TABLE budget_transfers ADD COLUMN workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL;
-- Need to add workflow_id to these tables if not present from their original definition.
-- Checking budget_requests from 20250529163732_copper_canyon.sql: it has workflow_id.
ALTER TABLE budget_requests ADD CONSTRAINT fk_budget_requests_workflow FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE SET NULL;
ALTER TABLE budget_transfers ADD CONSTRAINT fk_budget_transfers_workflow FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE SET NULL;


CREATE TRIGGER update_workflows_updated_at
BEFORE UPDATE ON workflows
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Help Center Tables (as per 20250530072057_wandering_garden.sql)

CREATE TABLE IF NOT EXISTS help_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL UNIQUE,
  icon TEXT, -- Made optional
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE TRIGGER update_help_categories_updated_at
BEFORE UPDATE ON help_categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS help_quick_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Made optional
  bg_color TEXT,
  icon_color TEXT,
  url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE TRIGGER update_help_quick_actions_updated_at
BEFORE UPDATE ON help_quick_actions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS help_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category_id UUID REFERENCES help_categories(id) ON DELETE SET NULL, -- Link to category table
  content TEXT NOT NULL,
  read_time INTEGER DEFAULT 5, -- Estimated read time in minutes
  featured BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE TRIGGER update_help_articles_updated_at
BEFORE UPDATE ON help_articles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS help_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('feature', 'maintenance', 'announcement', 'improvement', 'fix')),
  publish_date DATE DEFAULT CURRENT_DATE, -- Added publish date
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE TRIGGER update_help_updates_updated_at
BEFORE UPDATE ON help_updates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- User who submitted ticket
  email TEXT NOT NULL, -- Can be different from user's account email, or for unauth users
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL, -- e.g., 'Technical Issue', 'Billing', 'Feature Request'
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium', -- Added priority
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'pending_user_response')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL, -- Could be same as user_id or an admin creating on behalf
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_to_agent_id UUID REFERENCES public.users(id) ON DELETE SET NULL -- Agent working on ticket
);

CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON support_tickets
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add Indexes for foreign keys and frequently queried columns
CREATE INDEX IF NOT EXISTS idx_properties_created_by ON properties(created_by);
CREATE INDEX IF NOT EXISTS idx_property_users_property_id ON property_users(property_id);
CREATE INDEX IF NOT EXISTS idx_property_users_user_id ON property_users(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_property_id ON budgets(property_id);
CREATE INDEX IF NOT EXISTS idx_budgets_created_by ON budgets(created_by);
CREATE INDEX IF NOT EXISTS idx_financial_reports_property_id ON financial_reports(property_id);
CREATE INDEX IF NOT EXISTS idx_capex_requests_property_id ON capex_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_capex_requests_budget_id ON capex_requests(budget_id);
CREATE INDEX IF NOT EXISTS idx_capex_requests_workflow_id ON capex_requests(workflow_id);
CREATE INDEX IF NOT EXISTS idx_assets_property_id ON assets(property_id);
CREATE INDEX IF NOT EXISTS idx_asset_maintenance_asset_id ON asset_maintenance(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_transfers_asset_id ON asset_transfers(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_disposals_property_id ON asset_disposals(property_id);
CREATE INDEX IF NOT EXISTS idx_asset_disposals_asset_id ON asset_disposals(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_disposals_workflow_id ON asset_disposals(workflow_id);
CREATE INDEX IF NOT EXISTS idx_documents_property_id ON documents(property_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_by ON documents(created_by);
CREATE INDEX IF NOT EXISTS idx_transmittals_property_id ON transmittals(property_id);
CREATE INDEX IF NOT EXISTS idx_transmittals_workflow_id ON transmittals(workflow_id);
CREATE INDEX IF NOT EXISTS idx_submittals_property_id ON submittals(property_id);
CREATE INDEX IF NOT EXISTS idx_submittals_workflow_id ON submittals(workflow_id);
CREATE INDEX IF NOT EXISTS idx_rfis_property_id ON rfis(property_id);
CREATE INDEX IF NOT EXISTS idx_rfis_workflow_id ON rfis(workflow_id);
CREATE INDEX IF NOT EXISTS idx_tasks_property_id ON tasks(property_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_user_id ON tasks(assignee_user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_template_id ON workflows(template_id);
CREATE INDEX IF NOT EXISTS idx_workflows_entity_id ON workflows(entity_id);
CREATE INDEX IF NOT EXISTS idx_workflows_created_by ON workflows(created_by);
CREATE INDEX IF NOT EXISTS idx_help_articles_category_id ON help_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to_agent_id ON support_tickets(assigned_to_agent_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_user_id ON user_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_role ON user_role_assignments(role);

-- Add foreign key constraint from workflows.template_id to workflow_templates.id
-- This might fail if workflow_templates is created after workflows, so ensure order.
-- It's already specified in workflows table definition.

-- Note: RLS policies and auth.uid() specific functions are intentionally omitted.
-- Timestamps are handled by DEFAULT and the trigger for updated_at.

-- Add workflow_id columns to tables that were missing it but referenced in workflow RLS policies
-- budget_requests already has it from 20250529163732_copper_canyon.sql
-- budget_transfers already has it from 20250529163732_copper_canyon.sql

-- The workflow_id columns in capex_requests, asset_disposals, transmittals, submittals, rfis
-- are already defined with ON DELETE SET NULL.

-- Final check on user foreign keys:
-- All created_by, updated_by, assigned_to, user_id fields should reference public.users(id).
-- This has been applied throughout the script.
-- ON DELETE SET NULL is used for user references to allow user deletion without cascading to all their created records,
-- or ON DELETE CASCADE where appropriate (e.g., property_users, user_role_assignments).

INSERT INTO role_permissions (role, description, permissions) VALUES
('admin', 'System Administrator', '{
    "users": ["create", "read", "update", "delete"],
    "properties": ["create", "read", "update", "delete"],
    "financial_reports": ["create", "read", "update", "delete"],
    "budgets": ["create", "read", "update", "delete"],
    "capex_requests": ["create", "read", "update", "delete", "approve"],
    "workflows": ["create", "read", "update", "delete"],
    "workflow_templates": ["create", "read", "update", "delete"],
    "role_permissions": ["create", "read", "update", "delete"],
    "user_role_assignments": ["create", "read", "update", "delete"],
    "assets": ["create", "read", "update", "delete"],
    "asset_maintenance": ["create", "read", "update", "delete"],
    "asset_transfers": ["create", "read", "update", "delete"],
    "asset_disposals": ["create", "read", "update", "delete", "approve"],
    "documents": ["create", "read", "update", "delete"],
    "transmittals": ["create", "read", "update", "delete"],
    "submittals": ["create", "read", "update", "delete", "approve"],
    "rfis": ["create", "read", "update", "delete", "answer"],
    "tasks": ["create", "read", "update", "delete"],
    "help_content": ["create", "read", "update", "delete"],
    "support_tickets": ["create", "read", "update", "delete", "resolve"]
}'),
('property_manager', 'Property Manager', '{
    "properties": ["read", "update"],
    "financial_reports": ["create", "read", "update"],
    "budgets": ["create", "read", "update"],
    "capex_requests": ["create", "read", "update"],
    "assets": ["create", "read", "update", "delete"],
    "documents": ["create", "read", "update", "delete"],
    "tasks": ["create", "read", "update", "delete"]
}'),
('finance_manager', 'Finance Manager', '{
    "financial_reports": ["create", "read", "update", "delete"],
    "budgets": ["create", "read", "update", "approve"],
    "capex_requests": ["read", "approve"],
    "asset_disposals": ["read", "approve"]
}'),
('staff_level_1', 'Staff Level 1', '{
    "financial_reports": ["read"],
    "budgets": ["read"],
    "capex_requests": ["create", "read"],
    "tasks": ["read", "update"]
}'),
('viewer', 'General Viewer', '{
    "properties": ["read"],
    "financial_reports": ["read"],
    "budgets": ["read"],
    "capex_requests": ["read"],
    "assets": ["read"],
    "documents": ["read"],
    "tasks": ["read"],
    "help_content": ["read"],
    "support_tickets": ["create", "read"]
}')
ON CONFLICT (role) DO NOTHING;

-- Default workflow templates (from 20250529170324_ivory_fog.sql, adjusted steps for new format)
INSERT INTO workflow_templates (name, description, category, steps) VALUES
('Simple Approval', 'Single-level approval by Finance Director', 'Finance', '[
  {"id": "step1", "name": "Finance Director Approval", "description": "Finance director reviews and approves.", "approver_role": "finance_manager"}
]'),
('Standard Approval', 'Two-level approval with Operations and Finance', 'Operations', '[
  {"id": "step1", "name": "Operations Review", "description": "Operations manager reviews and approves.", "approver_role": "property_manager"},
  {"id": "step2", "name": "Financial Approval", "description": "Finance director provides final financial approval.", "approver_role": "finance_manager"}
]'),
('Extended Approval', 'Three-level approval for high-value items', 'Capex', '[
  {"id": "step1", "name": "Department Head Review", "description": "Department head reviews the request.", "approver_role": "property_manager"},
  {"id": "step2", "name": "Financial Review", "description": "Finance director reviews for budget compliance.", "approver_role": "finance_manager"},
  {"id": "step3", "name": "General Manager Approval", "description": "General Manager provides final approval.", "approver_role": "admin"}
]')
ON CONFLICT (name) DO NOTHING;This is a very comprehensive schema based on the migration files. I've tried to consolidate and use the latest definitions where tables appeared multiple times, and adjusted foreign keys to `public.users(id)`. I've also added the `role_permissions` and `user_role_assignments` tables as requested, and a few sample roles and workflow templates.

One crucial part is the `update_updated_at_column` function and its associated triggers. This function was defined in `server/src/db/database.ts` in the previous subtask for the `users` table. I've added triggers for all new tables that have `updated_at` columns to use this same function. This assumes the function is available in the public schema when this script runs.

The order of table creation in `schema.sql` is important to respect foreign key constraints. I've tried to order them logically. The `ALTER TABLE ... ADD CONSTRAINT fk_...` statements for `workflows` are at the end of the `workflows` table section to ensure the referenced tables exist.

Next, I need to modify `server/src/db/database.ts` to execute this `schema.sql` file after creating the `users` table and the `update_updated_at_column` function.
