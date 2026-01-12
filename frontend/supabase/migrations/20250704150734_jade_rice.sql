/*
  # Add Co-curricular Marks Support

  1. Schema Changes
    - Add marks columns to student_cocurricular_results table
    - Add full_marks column for customizable marks per subject
    - Add computed total_marks column

  2. Data Changes
    - Ensure the two required co-curricular subjects exist
    - Clean up any old subjects that are not needed

  3. Notes
    - Uses proper UUID generation for subject IDs
    - Maintains backward compatibility with existing grade columns
*/

-- Add marks columns to student_cocurricular_results table
DO $$
BEGIN
  -- Add marks columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'student_cocurricular_results' AND column_name = 'first_term_marks'
  ) THEN
    ALTER TABLE student_cocurricular_results ADD COLUMN first_term_marks integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'student_cocurricular_results' AND column_name = 'second_term_marks'
  ) THEN
    ALTER TABLE student_cocurricular_results ADD COLUMN second_term_marks integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'student_cocurricular_results' AND column_name = 'final_term_marks'
  ) THEN
    ALTER TABLE student_cocurricular_results ADD COLUMN final_term_marks integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'student_cocurricular_results' AND column_name = 'full_marks'
  ) THEN
    ALTER TABLE student_cocurricular_results ADD COLUMN full_marks integer DEFAULT 50;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'student_cocurricular_results' AND column_name = 'total_marks'
  ) THEN
    ALTER TABLE student_cocurricular_results ADD COLUMN total_marks integer GENERATED ALWAYS AS (
      first_term_marks + second_term_marks + final_term_marks
    ) STORED;
  END IF;
END $$;

-- Update existing cocurricular_subjects to have the fixed subjects
-- First, insert or update the required subjects
INSERT INTO cocurricular_subjects (name, code) VALUES
  ('Health & Physical Education', 'HPE'),
  ('Art Education', 'ART')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name;

-- Remove old subjects that are not the required ones
DELETE FROM cocurricular_subjects 
WHERE code NOT IN ('HPE', 'ART');