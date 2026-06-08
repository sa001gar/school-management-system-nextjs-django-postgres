import api from './client';
import type { PaginatedResponse } from '@/types/api';

export interface StudentResult {
  id: string;
  student_id: string;
  subject_id: string;
  session_id: string;
  marks_obtained: number;
  full_marks: number;
  grade: string;
  created_at: string;
  student?: { id: string; name: string; roll_no: string };
  subject?: { id: string; name: string };
}

export const resultsApi = {
  getAll: async (params?: {
    student_id?: string;
    subject_id?: string;
    session_id?: string;
    page?: number;
  }): Promise<PaginatedResponse<StudentResult>> => {
    return api.get<PaginatedResponse<StudentResult>>('/results/student-results/', params);
  },
  getByClassSection: async (params: {
    session_id: string;
    class_id: string;
    section_id: string;
    subject_id: string;
  }): Promise<StudentResult[]> => {
    return api.get<StudentResult[]>('/results/student-results/by-class-section/', params);
  },
  getMyResults: async (params?: { session_id?: string }): Promise<StudentResult[]> => {
    return api.get<StudentResult[]>('/results/student-results/my-results/', params);
  },
  compute: async (data: { session_id: string; class_id: string; section_id: string }): Promise<{ message: string }> => {
    return api.post<{ message: string }>('/results/compute/', data);
  },
  refresh: async (data: { session_id: string }): Promise<{ message: string }> => {
    return api.post<{ message: string }>('/results/refresh/', data);
  },
};
