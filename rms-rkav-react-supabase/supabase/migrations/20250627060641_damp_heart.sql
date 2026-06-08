/*
  # Insert Sample Data

  1. Sample Data
    - Sessions for current and previous years
    - Classes from 1st to 12th
    - Sections A, B, C for each class
    - Common subjects
    - Sample students
    - Sample teacher accounts

  2. Notes
    - This is sample data for testing
    - In production, you'll want to customize this data
*/

-- Insert Sessions
INSERT INTO sessions (name, start_date, end_date, is_active) VALUES
  ('2023-24', '2023-04-01', '2024-03-31', true),
  ('2022-23', '2022-04-01', '2023-03-31', false),
  ('2024-25', '2024-04-01', '2025-03-31', false);

-- Insert Classes
INSERT INTO classes (name, level) VALUES
  ('1st', 1), ('2nd', 2), ('3rd', 3), ('4th', 4), ('5th', 5),
  ('6th', 6), ('7th', 7), ('8th', 8), ('9th', 9), ('10th', 10),
  ('11th', 11), ('12th', 12);

-- Insert Sections (A, B, C for each class)
INSERT INTO sections (name, class_id)
SELECT 'A', c.id FROM classes c
UNION ALL
SELECT 'B', c.id FROM classes c
UNION ALL
SELECT 'C', c.id FROM classes c;

-- Insert Subjects
INSERT INTO subjects (name, code, full_marks) VALUES
  ('Mathematics', 'MATH', 100),
  ('English', 'ENG', 100),
  ('Science', 'SCI', 100),
  ('Social Studies', 'SS', 100),
  ('Hindi', 'HIN', 100),
  ('Computer Science', 'CS', 100),
  ('Physics', 'PHY', 100),
  ('Chemistry', 'CHEM', 100),
  ('Biology', 'BIO', 100),
  ('History', 'HIST', 100),
  ('Geography', 'GEO', 100),
  ('Economics', 'ECO', 100);

-- Insert Sample Students for Class 10, Section A (you can expand this)
DO $$
DECLARE
  session_2023_24 uuid;
  class_10 uuid;
  section_a uuid;
BEGIN
  -- Get IDs
  SELECT id INTO session_2023_24 FROM sessions WHERE name = '2023-24';
  SELECT id INTO class_10 FROM classes WHERE name = '10th';
  SELECT id INTO section_a FROM sections WHERE name = 'A' AND class_id = class_10;

  -- Insert students
  INSERT INTO students (roll_no, name, class_id, section_id, session_id) VALUES
    ('001', 'Aarav Sharma', class_10, section_a, session_2023_24),
    ('002', 'Vivaan Patel', class_10, section_a, session_2023_24),
    ('003', 'Aditya Kumar', class_10, section_a, session_2023_24),
    ('004', 'Vihaan Singh', class_10, section_a, session_2023_24),
    ('005', 'Arjun Gupta', class_10, section_a, session_2023_24),
    ('006', 'Sai Reddy', class_10, section_a, session_2023_24),
    ('007', 'Reyansh Jain', class_10, section_a, session_2023_24),
    ('008', 'Ayaan Khan', class_10, section_a, session_2023_24),
    ('009', 'Krishna Agarwal', class_10, section_a, session_2023_24),
    ('010', 'Ishaan Verma', class_10, section_a, session_2023_24),
    ('011', 'Ananya Sharma', class_10, section_a, session_2023_24),
    ('012', 'Diya Patel', class_10, section_a, session_2023_24),
    ('013', 'Priya Kumar', class_10, section_a, session_2023_24),
    ('014', 'Riya Singh', class_10, section_a, session_2023_24),
    ('015', 'Sara Gupta', class_10, section_a, session_2023_24);
END $$;

-- Insert more students for Class 9, Section A
DO $$
DECLARE
  session_2023_24 uuid;
  class_9 uuid;
  section_a uuid;
BEGIN
  -- Get IDs
  SELECT id INTO session_2023_24 FROM sessions WHERE name = '2023-24';
  SELECT id INTO class_9 FROM classes WHERE name = '9th';
  SELECT id INTO section_a FROM sections WHERE name = 'A' AND class_id = class_9;

  -- Insert students
  INSERT INTO students (roll_no, name, class_id, section_id, session_id) VALUES
    ('001', 'Aryan Mehta', class_9, section_a, session_2023_24),
    ('002', 'Kavya Shah', class_9, section_a, session_2023_24),
    ('003', 'Rohan Joshi', class_9, section_a, session_2023_24),
    ('004', 'Aditi Nair', class_9, section_a, session_2023_24),
    ('005', 'Dev Pandey', class_9, section_a, session_2023_24),
    ('006', 'Meera Iyer', class_9, section_a, session_2023_24),
    ('007', 'Karan Bhatt', class_9, section_a, session_2023_24),
    ('008', 'Sneha Rao', class_9, section_a, session_2023_24),
    ('009', 'Rahul Desai', class_9, section_a, session_2023_24),
    ('010', 'Pooja Sinha', class_9, section_a, session_2023_24);
END $$;