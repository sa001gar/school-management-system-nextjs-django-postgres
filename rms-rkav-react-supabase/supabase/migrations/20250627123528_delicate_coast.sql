/*
  # Add Admin User and Role Management

  1. New Tables
    - `admins`
      - `id` (uuid, primary key, references users)
      - `email` (text, unique)
      - `name` (text)
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on `admins` table
    - Add policies for admin access
    - Update existing policies to allow admin access
  
  3. Changes
    - Add admin policies to all existing tables
    - Allow admins to manage all data
*/

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'admins_id_fkey'
  ) THEN
    ALTER TABLE admins ADD CONSTRAINT admins_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Admin policies
CREATE POLICY "Admins can read own data"
  ON admins
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can update own data"
  ON admins
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing table policies to allow admin access

-- Sessions policies for admin
CREATE POLICY "Admins can manage sessions"
  ON sessions
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Classes policies for admin
CREATE POLICY "Admins can manage classes"
  ON classes
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Sections policies for admin
CREATE POLICY "Admins can manage sections"
  ON sections
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Subjects policies for admin
CREATE POLICY "Admins can manage subjects"
  ON subjects
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Students policies for admin
CREATE POLICY "Admins can manage students"
  ON students
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Student results policies for admin
CREATE POLICY "Admins can manage student results"
  ON student_results
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Teachers policies for admin
CREATE POLICY "Admins can manage teachers"
  ON teachers
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());