import api from './client';

interface StudentProfile {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  parent_name?: string;
  parent_phone?: string;
  enrollment_number?: string;
  created_at: string;
  updated_at: string;
}

interface StudentResult {
  id: string;
  subject: string;
  total_marks: number;
  marks_obtained: number;
  grade?: string;
  grade_point?: number;
  remarks?: string;
}

interface ReportCard {
  id: string;
  session: string;
  class_name: string;
  section: string;
  total_marks: number;
  marks_obtained: number;
  percentage: number;
  grade?: string;
  rank?: number;
  results: StudentResult[];
}

interface Marksheet {
  id: string;
  session: string;
  class_name: string;
  section: string;
  assessment_type: string;
  total_marks: number;
  marks_obtained: number;
  percentage: number;
  grade?: string;
  remarks?: string;
}

interface Ranking {
  id: string;
  session: string;
  class_name: string;
  section: string;
  total_marks: number;
  marks_obtained: number;
  percentage: number;
  rank: number;
  total_students: number;
}

interface EnrollmentHistory {
  id: string;
  session: string;
  class_name: string;
  section: string;
  status: string;
  enrollment_date: string;
}

export const studentPortalApi = {
  getProfile: async (): Promise<StudentProfile> => {
    return api.get<StudentProfile>('/student/profile/');
  },
  getResults: async (sessionId?: string): Promise<StudentResult[]> => {
    return api.get<StudentResult[]>('/student/results/', sessionId ? { session_id: sessionId } : undefined);
  },
  getReportCard: async (sessionId?: string): Promise<ReportCard> => {
    return api.get<ReportCard>('/student/report-card/', sessionId ? { session_id: sessionId } : undefined);
  },
  getMarksheet: async (sessionId?: string): Promise<Marksheet> => {
    return api.get<Marksheet>('/student/marksheet/', sessionId ? { session_id: sessionId } : undefined);
  },
  getRanking: async (sessionId?: string): Promise<Ranking> => {
    return api.get<Ranking>('/student/ranking/', sessionId ? { session_id: sessionId } : undefined);
  },
  getEnrollmentHistory: async (): Promise<EnrollmentHistory[]> => {
    return api.get<EnrollmentHistory[]>('/student/enrollment-history/');
  },
};
