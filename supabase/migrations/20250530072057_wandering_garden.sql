/*
  # Help Center Tables

  1. New Tables
    - `help_quick_actions` - Quick action cards on the help center homepage
    - `help_categories` - Categories for help articles
    - `help_articles` - Help articles and documentation
    - `help_updates` - System updates and announcements
    - `support_tickets` - User-submitted support tickets
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read help content
    - Add policies for admins to manage help content
*/

-- Create help_quick_actions table
CREATE TABLE IF NOT EXISTS help_quick_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  icon text NOT NULL,
  bg_color text NOT NULL,
  icon_color text NOT NULL,
  url text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Create help_categories table
CREATE TABLE IF NOT EXISTS help_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  icon text NOT NULL,
  description text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Create help_articles table
CREATE TABLE IF NOT EXISTS help_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL,
  category_id uuid REFERENCES help_categories(id),
  content text NOT NULL,
  read_time integer DEFAULT 5,
  featured boolean DEFAULT false,
  views integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Create help_updates table
CREATE TABLE IF NOT EXISTS help_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  type text NOT NULL CHECK (type IN ('feature', 'maintenance', 'announcement')),
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Create support_tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  category text NOT NULL,
  status text NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS help_articles_category_id_idx ON help_articles(category_id);
CREATE INDEX IF NOT EXISTS help_articles_featured_idx ON help_articles(featured);
CREATE INDEX IF NOT EXISTS help_articles_views_idx ON help_articles(views);
CREATE INDEX IF NOT EXISTS help_updates_type_idx ON help_updates(type);
CREATE INDEX IF NOT EXISTS support_tickets_status_idx ON support_tickets(status);

-- Enable Row Level Security
ALTER TABLE help_quick_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Create policies for help_quick_actions
CREATE POLICY "Anyone can read help_quick_actions"
  ON help_quick_actions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage help_quick_actions"
  ON help_quick_actions
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create policies for help_categories
CREATE POLICY "Anyone can read help_categories"
  ON help_categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage help_categories"
  ON help_categories
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create policies for help_articles
CREATE POLICY "Anyone can read help_articles"
  ON help_articles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage help_articles"
  ON help_articles
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create policies for help_updates
CREATE POLICY "Anyone can read help_updates"
  ON help_updates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage help_updates"
  ON help_updates
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create policies for support_tickets
CREATE POLICY "Users can create support_tickets"
  ON support_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read their own support_tickets"
  ON support_tickets
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage support_tickets"
  ON support_tickets
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert sample data for help_quick_actions
INSERT INTO help_quick_actions (title, description, icon, bg_color, icon_color, url, display_order)
VALUES
  ('Submit a Ticket', 'Get help from our support team', 'MessageSquare', 'bg-green-50', 'text-green-600', '/help/submit-ticket', 1),
  ('View Tutorials', 'Learn through video guides', 'Play', 'bg-orange-50', 'text-orange-600', '/help/tutorials', 2),
  ('Contact Support', '24/7 support available', 'HelpCircle', 'bg-yellow-50', 'text-yellow-600', '/help/contact', 3),
  ('Documentation', 'Read detailed guides', 'Book', 'bg-blue-50', 'text-blue-600', '/help/documentation', 4);

-- Insert sample data for help_categories
INSERT INTO help_categories (title, icon, description, display_order)
VALUES
  ('Getting Started', 'Book', 'Basic guides to get you started with Zepth Edge', 1),
  ('Property Management', 'FileText', 'Learn how to manage your properties effectively', 2),
  ('Financial Management', 'DollarSign', 'Guides for budgeting and financial operations', 3),
  ('Asset Management', 'Tag', 'Managing your assets and inventory', 4),
  ('Document Management', 'FileText', 'Working with documents and collaboration', 5);

-- Insert sample data for help_articles
INSERT INTO help_articles (title, category, category_id, content, read_time, featured, views)
VALUES
  (
    'Getting Started with Zepth Edge',
    'Basics',
    (SELECT id FROM help_categories WHERE title = 'Getting Started'),
    'This is a detailed guide on how to get started with Zepth Edge...',
    5,
    true,
    1234
  ),
  (
    'User Roles & Permissions',
    'Basics',
    (SELECT id FROM help_categories WHERE title = 'Getting Started'),
    'Learn about the different user roles and permissions in Zepth Edge...',
    4,
    false,
    856
  ),
  (
    'Navigation Guide',
    'Basics',
    (SELECT id FROM help_categories WHERE title = 'Getting Started'),
    'A comprehensive guide to navigating the Zepth Edge platform...',
    3,
    false,
    654
  ),
  (
    'Managing Property Documents',
    'Documents',
    (SELECT id FROM help_categories WHERE title = 'Document Management'),
    'Learn how to effectively manage property documents in Zepth Edge...',
    8,
    true,
    987
  ),
  (
    'Budget Approval Workflow',
    'Finance',
    (SELECT id FROM help_categories WHERE title = 'Financial Management'),
    'A step-by-step guide to the budget approval workflow...',
    6,
    true,
    765
  ),
  (
    'Asset Disposal Guide',
    'Operations',
    (SELECT id FROM help_categories WHERE title = 'Asset Management'),
    'How to properly dispose of assets in Zepth Edge...',
    7,
    true,
    543
  );

-- Insert sample data for help_updates
INSERT INTO help_updates (title, description, type)
VALUES
  ('New Feature: Document Hub', 'Explore our new document collaboration features in the latest update.', 'feature'),
  ('System Maintenance', 'Scheduled maintenance on April 20, 2025, from 2 AM to 4 AM EST.', 'maintenance'),
  ('New Asset Management Module', 'We''ve added a comprehensive asset management module to help you track your inventory.', 'feature');