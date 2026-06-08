import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

// Create a separate admin client for admin operations
export const createAdminClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: false, // Don't persist admin sessions
      detectSessionInUrl: false
    }
  })
}

// Set up auth state change listener to handle expired sessions
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' && !session) {
    // Check if this was due to an expired token
    const currentPath = window.location.pathname
    if (currentPath !== '/' && !currentPath.includes('login')) {
      // Redirect to login with session expired flag
      window.location.href = '/?session_expired=true'
    }
  }
})

// Types
export interface Teacher {
  id: string
  email: string
  name: string
  created_at: string
}

export interface Admin {
  id: string
  email: string
  name: string
  created_at: string
}

export interface Session {
  id: string
  name: string
  start_date: string
  end_date: string
  is_active: boolean
}

export interface Class {
  id: string
  name: string
  level: number
}

export interface Section {
  id: string
  name: string
  class_id: string
}

export interface Subject {
  id: string
  name: string
  code: string
  full_marks: number
}

export interface CocurricularSubject {
  id: string
  name: string
  code: string
}

export interface OptionalSubject {
  id: string
  name: string
  code: string
  default_full_marks: number
  created_at: string
}

export interface ClassOptionalConfig {
  id: string
  class_id: string
  has_optional: boolean
  created_at: string
}

export interface ClassOptionalAssignment {
  id: string
  class_id: string
  optional_subject_id: string
  full_marks: number
  is_required: boolean
  created_at: string
}

export interface StudentOptionalResult {
  id: string
  student_id: string
  optional_subject_id: string
  session_id: string
  obtained_marks: number
  full_marks: number
  grade: string
  created_at: string
  updated_at: string
}
export interface ClassCocurricularConfig {
  id: string
  class_id: string
  has_cocurricular: boolean
}

export interface SchoolConfig {
  id: string
  class_id: string
  session_id: string
  total_school_days: number
  created_at: string
  updated_at: string
}

export interface ClassMarksDistribution {
  id: string
  class_id: string
  first_summative_marks: number
  first_formative_marks: number
  second_summative_marks: number
  second_formative_marks: number
  third_summative_marks: number
  third_formative_marks: number
  total_marks: number
  created_at: string
  updated_at: string
}

export interface Student {
  id: string
  roll_no: string
  name: string
  class_id: string
  section_id: string
  session_id: string
}

export interface StudentResult {
  id: string
  student_id: string
  subject_id: string
  session_id: string
  first_summative_full: number
  first_summative_obtained: number
  first_formative_full: number
  first_formative_obtained: number
  second_summative_full: number
  second_summative_obtained: number
  second_formative_full: number
  second_formative_obtained: number
  third_summative_full: number
  third_summative_obtained: number
  third_formative_full: number
  third_formative_obtained: number
  total_marks: number
  grade: string
  conduct: string
  attendance_days: number
}

export interface StudentCocurricularResult {
  id: string
  student_id: string
  cocurricular_subject_id: string
  session_id: string
  first_term_marks?: number
  second_term_marks?: number
  final_term_marks?: number
  full_marks?: number
  total_marks?: number
  first_term_grade: string
  second_term_grade: string
  final_term_grade: string
  overall_grade: string
}