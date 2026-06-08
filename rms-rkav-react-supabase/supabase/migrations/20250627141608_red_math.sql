/*
  # Add Co-curricular Activities Support

  1. New Tables
    - `class_cocurricular_config` - Configure which classes have co-curricular activities
    - `cocurricular_subjects` - Define co-curricular subjects
    - `student_cocurricular_results` - Store co-curricular grades

  2. Security
    - Enable RLS on all new tables
    - Add policies for teachers and admins

  3. Changes
    - Add support for grade-based co-curricular activities
    - Link to existing class structure
*/

-- Co-curricular subjects table
CREATE TABLE IF NOT EXISTS cocurricular_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Class co-curricular configuration
CREATE TABLE IF NOT EXISTS class_cocurricular_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  has_cocurricular boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(class_id)
);

-- Student co-curricular results
CREATE TABLE IF NOT EXISTS student_cocurricular_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  cocurricular_subject_id uuid REFERENCES cocurricular_subjects(id) ON DELETE CASCADE,
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  first_term_grade text DEFAULT 'A',
  second_term_grade text DEFAULT 'A',
  final_term_grade text DEFAULT 'A',
  overall_grade text DEFAULT 'A',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, cocurricular_subject_id, session_id)
);

-- Enable RLS
ALTER TABLE cocurricular_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_cocurricular_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_cocurricular_results ENABLE ROW LEVEL SECURITY;

-- Policies for cocurricular_subjects
CREATE POLICY "Teachers can read cocurricular subjects"
  ON cocurricular_subjects
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage cocurricular subjects"
  ON cocurricular_subjects
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Policies for class_cocurricular_config
CREATE POLICY "Teachers can read class cocurricular config"
  ON class_cocurricular_config
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage class cocurricular config"
  ON class_cocurricular_config
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Policies for student_cocurricular_results
CREATE POLICY "Teachers can read student cocurricular results"
  ON student_cocurricular_results
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers can insert student cocurricular results"
  ON student_cocurricular_results
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Teachers can update student cocurricular results"
  ON student_cocurricular_results
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage student cocurricular results"
  ON student_cocurricular_results
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Insert default co-curricular subjects
INSERT INTO cocurricular_subjects (name, code) VALUES
  ('Physical Education', 'PE'),
  ('Art Education', 'ART'),
  ('Work Education', 'WORK');

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_student_cocurricular_results_updated_at
  BEFORE UPDATE ON student_cocurricular_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_class_cocurricular_config_class ON class_cocurricular_config(class_id);
CREATE INDEX IF NOT EXISTS idx_student_cocurricular_results_student_subject_session ON student_cocurricular_results(student_id, cocurricular_subject_id, session_id);