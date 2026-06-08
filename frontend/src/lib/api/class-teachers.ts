import api from './client';
import type { PaginatedResponse } from '@/types';

interface ClassTeacher {
  id: string;
  teacher: string;
  class_assigned: string;
  section: string;
  session: string;
  created_at: string;
  updated_at: string;
}

export const classTeachersApi = {
  getAll: async (filters?: Record<string, unknown>): Promise<PaginatedResponse<ClassTeacher>> => {
    return api.get<PaginatedResponse<ClassTeacher>>('/enrollments/class-teachers/', filters);
  },
  create: async (data: Partial<ClassTeacher>): Promise<ClassTeacher> => {
    return api.post<ClassTeacher>('/enrollments/class-teachers/', data);
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/enrollments/class-teachers/${id}/`);
  },
  listBySession: async (sessionId: string): Promise<ClassTeacher[]> => {
    return api.get<ClassTeacher[]>('/enrollments/class-teachers/by-session/', {
      session_id: sessionId,
    });
  },
};
