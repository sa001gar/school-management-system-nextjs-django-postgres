/*
  # Create class_subject_assignments table

  1. New Tables
    - `class_subject_assignments`
      - `id` (uuid, primary key)
      - `class_id` (uuid, foreign key to classes)
      - `subject_id` (uuid, foreign key to subjects)
      - `is_required` (boolean, default true)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `class_subject_assignments` table
    - Add policy for admins to manage assignments
    - Add policy for teachers to read assignments

  3. Constraints
    - Unique constraint on class_id + subject_id combination
    - Foreign key constraints with CASCADE delete
*/

CREATE TABLE IF NOT EXISTS class_subject_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL,
  subject_id uuid NOT NULL,
  is_required boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE class_subject_assignments 
ADD CONSTRAINT class_subject_assignments_class_id_fkey 
FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;

ALTER TABLE class_subject_assignments 
ADD CONSTRAINT class_subject_assignments_subject_id_fkey 
FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE;

-- Add unique constraint to prevent duplicate assignments
ALTER TABLE class_subject_assignments 
ADD CONSTRAINT class_subject_assignments_class_subject_unique 
UNIQUE (class_id, subject_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_class_subject_assignments_class 
ON class_subject_assignments (class_id);

CREATE INDEX IF NOT EXISTS idx_class_subject_assignments_subject 
ON class_subject_assignments (subject_id);

-- Enable Row Level Security
ALTER TABLE class_subject_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can manage class subject assignments"
  ON class_subject_assignments
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Teachers can read class subject assignments"
  ON class_subject_assignments
  FOR SELECT
  TO authenticated
  USING (true);