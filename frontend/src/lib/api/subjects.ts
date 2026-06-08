import api from './client';
import type { Subject } from '@/types';

export const subjectsApi = {
  getAll: async (): Promise<Subject[]> => {
    const response = await api.get<{ results?: Subject[] } | Subject[]>('/subjects/');
    return Array.isArray(response) ? response : (response.results || []);
  },
  getById: async (id: string): Promise<Subject> => {
    return api.get<Subject>(`/subjects/${id}/`);
  },
  create: async (data: Partial<Subject>): Promise<Subject> => {
    return api.post<Subject>('/subjects/', data);
  },
  update: async (id: string, data: Partial<Subject>): Promise<Subject> => {
    return api.patch<Subject>(`/subjects/${id}/`, data);
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/subjects/${id}/`);
  },
  getAssignments: async (classId: string): Promise<Array<{ id: string; class_id: string; subject: Subject; is_required: boolean }>> => {
    const response = await api.get<{ results?: Array<{ id: string; class_id: string; subject: Subject; is_required: boolean }> }>('/class-subject-assignments/', { class_id: classId });
    return Array.isArray(response) ? response : (response.results || []);
  },
  bulkAssignToClass: async (data: { class_id: string; subject_ids: string[] }): Promise<void> => {
    await api.post('/class-subject-assignments/bulk-update/', data);
  },
};
