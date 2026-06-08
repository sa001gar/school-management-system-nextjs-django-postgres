export interface AssessmentType {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  created_at: string;
}

export interface AssessmentWeightage {
  id: string;
  assessment_type_id: string;
  class_id: string;
  subject_id: string;
  weightage: number;
  full_marks: number;
  created_at: string;
}
