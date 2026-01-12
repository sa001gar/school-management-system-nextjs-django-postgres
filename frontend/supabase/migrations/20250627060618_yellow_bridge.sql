/*
  # Initial Schema for School Result Management System

  1. New Tables
    - `teachers` - Store teacher information
    - `sessions` - Academic sessions/years
    - `classes` - Class levels (1st, 2nd, etc.)
    - `sections` - Class sections (A, B, C, etc.)
    - `subjects` - Academic subjects
    - `students` - Student information
    - `student_results` - Student marks and results

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated teachers
    - Teachers can only access their own data and student data
*/

-- Teachers table (extends auth.users)
CREATE TABLE IF NOT EXISTS teachers (
  id uuid REFERENCES auth.users(id) PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  level integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Sections table
CREATE TABLE IF NOT EXISTS sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  full_marks integer DEFAULT 100,
  created_at timestamptz DEFAULT now()
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roll_no text NOT NULL,
  name text NOT NULL,
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  section_id uuid REFERENCES sections(id) ON DELETE CASCADE,
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(roll_no, class_id, section_id, session_id)
);

-- Student Results table
CREATE TABLE IF NOT EXISTS student_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  first_summative_full integer DEFAULT 40,
  first_summative_obtained integer DEFAULT 0,
  first_formative_full integer DEFAULT 10,
  first_formative_obtained integer DEFAULT 0,
  second_summative_full integer DEFAULT 40,
  second_summative_obtained integer DEFAULT 0,
  second_formative_full integer DEFAULT 10,
  second_formative_obtained integer DEFAULT 0,
  third_summative_full integer DEFAULT 40,
  third_summative_obtained integer DEFAULT 0,
  third_formative_full integer DEFAULT 10,
  third_formative_obtained integer DEFAULT 0,
  total_marks integer DEFAULT 0,
  grade text DEFAULT 'F',
  conduct text DEFAULT 'Good',
  attendance_days integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, subject_id, session_id)
);

-- Enable RLS
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Teachers can read their own data
CREATE POLICY "Teachers can read own data"
  ON teachers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Teachers can update their own data
CREATE POLICY "Teachers can update own data"
  ON teachers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- All authenticated teachers can read sessions, classes, sections, subjects
CREATE POLICY "Teachers can read sessions"
  ON sessions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers can read classes"
  ON classes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers can read sections"
  ON sections
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers can read subjects"
  ON subjects
  FOR SELECT
  TO authenticated
  USING (true);

-- Teachers can read all students
CREATE POLICY "Teachers can read students"
  ON students
  FOR SELECT
  TO authenticated
  USING (true);

-- Teachers can read and modify all student results
CREATE POLICY "Teachers can read student results"
  ON student_results
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers can insert student results"
  ON student_results
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Teachers can update student results"
  ON student_results
  FOR UPDATE
  TO authenticated
  USING (true);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_class_section_session ON students(class_id, section_id, session_id);
CREATE INDEX IF NOT EXISTS idx_student_results_student_subject_session ON student_results(student_id, subject_id, session_id);
CREATE INDEX IF NOT EXISTS idx_sections_class ON sections(class_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_student_results_updated_at
  BEFORE UPDATE ON student_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();