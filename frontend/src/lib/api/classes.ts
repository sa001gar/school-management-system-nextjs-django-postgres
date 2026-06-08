import api from './client';
import type { Class, Section } from '@/types';

export const classesApi = {
  getAll: async (): Promise<Class[]> => {
    const response = await api.get<{ results?: Class[] } | Class[]>('/classes/');
    return Array.isArray(response) ? response : (response.results || []);
  },
  getById: async (id: string): Promise<Class> => {
    return api.get<Class>(`/classes/${id}/`);
  },
  create: async (data: Partial<Class>): Promise<Class> => {
    return api.post<Class>('/classes/', data);
  },
  update: async (id: string, data: Partial<Class>): Promise<Class> => {
    return api.patch<Class>(`/classes/${id}/`, data);
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/classes/${id}/`);
  },
  getSections: async (classId: string): Promise<Section[]> => {
    const response = await api.get<{ results?: Section[] } | Section[]>('/sections/', { class_id: classId });
    return Array.isArray(response) ? response : (response.results || []);
  },
  createSection: async (data: { name: string; class_id: string }): Promise<Section> => {
    return api.post<Section>('/sections/', data);
  },
  updateSection: async (id: string, data: Partial<Section>): Promise<Section> => {
    return api.patch<Section>(`/sections/${id}/`, data);
  },
  deleteSection: async (id: string): Promise<void> => {
    await api.delete(`/sections/${id}/`);
  },
};
