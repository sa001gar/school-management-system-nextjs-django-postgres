import api from './client';

export interface Teacher {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export const teachersApi = {
  getAll: async (): Promise<Teacher[]> => {
    const response = await api.get<{ results?: Teacher[] } | Teacher[]>('/teachers/');
    return Array.isArray(response) ? response : (response.results || []);
  },
  getById: async (id: string): Promise<Teacher> => {
    return api.get<Teacher>(`/teachers/${id}/`);
  },
  create: async (data: { email: string; password: string; name: string }): Promise<Teacher> => {
    return api.post<Teacher>('/teachers/', data);
  },
  update: async (id: string, data: { email?: string; name?: string }): Promise<Teacher> => {
    return api.patch<Teacher>(`/teachers/${id}/`, data);
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/teachers/${id}/`);
  },
  resetPassword: async (id: string): Promise<{ message: string }> => {
    return api.post<{ message: string }>(`/teachers/${id}/reset-password/`);
  },
};
