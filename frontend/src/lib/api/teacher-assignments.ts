import api from './client';
import type { PaginatedResponse } from '@/types';

interface TeacherAssignment {
  id: string;
  teacher: string;
  subject: string;
  class_assigned: string;
  section: string;
  session: string;
  created_at: string;
  updated_at: string;
}

export const teacherAssignmentsApi = {
  getAll: async (filters?: Record<string, unknown>): Promise<PaginatedResponse<TeacherAssignment>> => {
    return api.get<PaginatedResponse<TeacherAssignment>>('/academics/teacher-assignments/', filters);
  },
  create: async (data: Partial<TeacherAssignment>): Promise<TeacherAssignment> => {
    return api.post<TeacherAssignment>('/academics/teacher-assignments/', data);
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/academics/teacher-assignments/${id}/`);
  },
};
