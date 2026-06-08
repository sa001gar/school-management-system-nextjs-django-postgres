export interface MarksEntry {
  id: string;
  student_id: string;
  subject_id: string;
  exam_type_id: string;
  session_id: string;
  marks_obtained: number;
  full_marks: number;
  is_absent: boolean;
  remarks: string | null;
  created_at: string;
  student?: { id: string; name: string; roll_no: string };
  subject?: { id: string; name: string };
}

export interface SubjectResult {
  id: string;
  student_id: string;
  subject_id: string;
  session_id: string;
  marks_obtained: number;
  full_marks: number;
  grade: string;
  created_at: string;
}
