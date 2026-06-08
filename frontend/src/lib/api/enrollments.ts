import api from './client';
import type { PaginatedResponse, Enrollment } from '@/types';

interface PromoteData {
  new_session?: string;
  new_class?: string;
  new_section?: string;
  remarks?: string;
}

interface RetainData {
  remarks?: string;
}

interface TransferOutData {
  transfer_school?: string;
  transfer_date?: string;
  remarks?: string;
}

interface BulkEnrollData {
  student_ids: string[];
  session_id: string;
  class_id: string;
  section_id: string;
}

export const enrollmentsApi = {
  getAll: async (filters?: Record<string, unknown>): Promise<PaginatedResponse<Enrollment>> => {
    return api.get<PaginatedResponse<Enrollment>>('/enrollments/enrollments/', filters);
  },
  create: async (data: Partial<Enrollment>): Promise<Enrollment> => {
    return api.post<Enrollment>('/enrollments/enrollments/', data);
  },
  getById: async (id: string): Promise<Enrollment> => {
    return api.get<Enrollment>(`/enrollments/enrollments/${id}/`);
  },
  promote: async (id: string, data: PromoteData): Promise<Enrollment> => {
    return api.post<Enrollment>(`/enrollments/enrollments/${id}/promote/`, data);
  },
  retain: async (id: string, data: RetainData): Promise<Enrollment> => {
    return api.post<Enrollment>(`/enrollments/enrollments/${id}/retain/`, data);
  },
  transferOut: async (id: string, data: TransferOutData): Promise<Enrollment> => {
    return api.post<Enrollment>(`/enrollments/enrollments/${id}/transfer-out/`, data);
  },
  bulkEnroll: async (data: BulkEnrollData): Promise<Enrollment[]> => {
    return api.post<Enrollment[]>('/enrollments/enrollments/bulk-enroll/', data);
  },
  getActive: async (studentId: string, sessionId: string): Promise<Enrollment> => {
    return api.get<Enrollment>('/enrollments/enrollments/active/', {
      student_id: studentId,
      session_id: sessionId,
    });
  },
};
