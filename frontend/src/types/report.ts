export interface ReportCard {
  student: { id: string; name: string; roll_no: string; class: string; section: string };
  results: Array<{
    subject_name: string;
    marks_obtained: number;
    full_marks: number;
    grade: string;
  }>;
  summary: {
    total_marks: number;
    total_full_marks: number;
    percentage: number;
    overall_grade: string;
    rank?: number;
  };
  session: { id: string; name: string };
}

export interface Marksheet {
  student: { id: string; name: string; roll_no: string; class: string; section: string };
  results: Array<{
    subject_name: string;
    marks_obtained: number;
    full_marks: number;
    grade: string;
  }>;
  summary: {
    total_marks: number;
    total_full_marks: number;
    percentage: number;
    overall_grade: string;
  };
}

export interface Ranking {
  student: { id: string; name: string; roll_no: string };
  total_marks: number;
  percentage: number;
  rank: number;
  overall_grade: string;
}
