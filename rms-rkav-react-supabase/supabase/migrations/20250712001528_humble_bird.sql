/*
  # Add Dynamic Marks Distribution and Optional Subjects

  1. New Tables
    - `optional_subjects` - Store optional subjects with custom full marks
    - `class_optional_config` - Configure which classes have optional subjects
    - `class_optional_assignments` - Assign optional subjects to classes
    - `student_optional_results` - Store student results for optional subjects
    - Update `class_marks_distribution` to support dynamic terms

  2. Changes
    - Modify class_marks_distribution to support variable number of terms
    - Add optional subject management
    - Add class configuration for optional subjects

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for admin and teacher access
*/

-- Create optional_subjects table
CREATE TABLE IF NOT EXISTS optional_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  default_full_marks integer DEFAULT 50,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE optional_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage optional subjects"
  ON optional_subjects
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Teachers can read optional subjects"
  ON optional_subjects
  FOR SELECT
  TO authenticated
  USING (true);

-- Create class_optional_config table
CREATE TABLE IF NOT EXISTS class_optional_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  has_optional boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(class_id)
);

ALTER TABLE class_optional_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage class optional config"
  ON class_optional_config
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Teachers can read class optional config"
  ON class_optional_config
  FOR SELECT
  TO authenticated
  USING (true);

-- Create class_optional_assignments table
CREATE TABLE IF NOT EXISTS class_optional_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  optional_subject_id uuid NOT NULL REFERENCES optional_subjects(id) ON DELETE CASCADE,
  full_marks integer DEFAULT 50,
  is_required boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(class_id, optional_subject_id)
);

ALTER TABLE class_optional_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage class optional assignments"
  ON class_optional_assignments
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Teachers can read class optional assignments"
  ON class_optional_assignments
  FOR SELECT
  TO authenticated
  USING (true);

-- Create student_optional_results table
CREATE TABLE IF NOT EXISTS student_optional_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  optional_subject_id uuid NOT NULL REFERENCES optional_subjects(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  obtained_marks integer DEFAULT 0,
  full_marks integer DEFAULT 50,
  grade text DEFAULT 'F',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, optional_subject_id, session_id)
);

ALTER TABLE student_optional_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage student optional results"
  ON student_optional_results
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Teachers can insert student optional results"
  ON student_optional_results
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Teachers can read student optional results"
  ON student_optional_results
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers can update student optional results"
  ON student_optional_results
  FOR UPDATE
  TO authenticated
  USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_student_optional_results_updated_at
  BEFORE UPDATE ON student_optional_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update class_marks_distribution to support dynamic terms
DO $$
BEGIN
  -- Add new columns for dynamic marks distribution
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'class_marks_distribution' AND column_name = 'number_of_unit_tests'
  ) THEN
    ALTER TABLE class_marks_distribution ADD COLUMN number_of_unit_tests integer DEFAULT 3;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'class_marks_distribution' AND column_name = 'has_final_term'
  ) THEN
    ALTER TABLE class_marks_distribution ADD COLUMN has_final_term boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'class_marks_distribution' AND column_name = 'unit_test_marks'
  ) THEN
    ALTER TABLE class_marks_distribution ADD COLUMN unit_test_marks integer DEFAULT 40;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'class_marks_distribution' AND column_name = 'formative_marks'
  ) THEN
    ALTER TABLE class_marks_distribution ADD COLUMN formative_marks integer DEFAULT 10;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'class_marks_distribution' AND column_name = 'final_term_marks'
  ) THEN
    ALTER TABLE class_marks_distribution ADD COLUMN final_term_marks integer DEFAULT 40;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_optional_subjects_code ON optional_subjects(code);
CREATE INDEX IF NOT EXISTS idx_class_optional_config_class ON class_optional_config(class_id);
CREATE INDEX IF NOT EXISTS idx_class_optional_assignments_class ON class_optional_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_class_optional_assignments_subject ON class_optional_assignments(optional_subject_id);
CREATE INDEX IF NOT EXISTS idx_student_optional_results_student_subject_session ON student_optional_results(student_id, optional_subject_id, session_id);