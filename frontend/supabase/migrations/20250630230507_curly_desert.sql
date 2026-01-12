/*
  # Add School Configuration Tables

  1. New Tables
    - `school_config` - Store school-wide settings like total days
    - `class_marks_distribution` - Store marks distribution for each class

  2. Security
    - Enable RLS on all new tables
    - Add policies for admins and teachers

  3. Changes
    - Add total school days configuration per class/session
    - Add marks distribution configuration per class
*/

-- School configuration table
CREATE TABLE IF NOT EXISTS school_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  total_school_days integer DEFAULT 200,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(class_id, session_id)
);

-- Class marks distribution table
CREATE TABLE IF NOT EXISTS class_marks_distribution (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  first_summative_marks integer DEFAULT 40,
  first_formative_marks integer DEFAULT 10,
  second_summative_marks integer DEFAULT 40,
  second_formative_marks integer DEFAULT 10,
  third_summative_marks integer DEFAULT 40,
  third_formative_marks integer DEFAULT 10,
  total_marks integer GENERATED ALWAYS AS (
    first_summative_marks + first_formative_marks +
    second_summative_marks + second_formative_marks +
    third_summative_marks + third_formative_marks
  ) STORED,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(class_id)
);

-- Enable RLS
ALTER TABLE school_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_marks_distribution ENABLE ROW LEVEL SECURITY;

-- Policies for school_config
CREATE POLICY "Teachers can read school config"
  ON school_config
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage school config"
  ON school_config
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Policies for class_marks_distribution
CREATE POLICY "Teachers can read class marks distribution"
  ON class_marks_distribution
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage class marks distribution"
  ON class_marks_distribution
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Triggers to update updated_at timestamp
CREATE TRIGGER update_school_config_updated_at
  BEFORE UPDATE ON school_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_class_marks_distribution_updated_at
  BEFORE UPDATE ON class_marks_distribution
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_school_config_class_session ON school_config(class_id, session_id);
CREATE INDEX IF NOT EXISTS idx_class_marks_distribution_class ON class_marks_distribution(class_id);

-- Insert default configurations for existing classes
INSERT INTO class_marks_distribution (class_id)
SELECT id FROM classes
ON CONFLICT (class_id) DO NOTHING;