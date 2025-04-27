/*
  # Create document templates and categories tables

  1. New Tables
    - `document_categories`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `icon` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `document_templates`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `category_id` (uuid, foreign key)
      - `template_html` (text)
      - `fields` (jsonb)
      - `keywords` (text array)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for:
      - Admins can perform all operations
      - Regular users can only read
*/

-- Create document categories table
CREATE TABLE IF NOT EXISTS document_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create document templates table
CREATE TABLE IF NOT EXISTS document_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category_id uuid REFERENCES document_categories(id),
  template_html text NOT NULL,
  fields jsonb NOT NULL DEFAULT '[]',
  keywords text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for document_categories
CREATE POLICY "Allow all access for admin users on categories"
  ON document_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Allow read access for authenticated users on categories"
  ON document_categories
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for document_templates
CREATE POLICY "Allow all access for admin users on templates"
  ON document_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Allow read access for authenticated users on templates"
  ON document_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- Create trigger for updating updated_at
CREATE TRIGGER update_document_categories_updated_at
  BEFORE UPDATE ON document_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_templates_updated_at
  BEFORE UPDATE ON document_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();