import api from './client';
import type { Session, PaginatedResponse } from '@/types';

export const sessionsApi = {
  getAll: async (): Promise<Session[]> => {
    const response = await api.get<{ results?: Session[] } | Session[]>('/sessions/');
    return Array.isArray(response) ? response : (response.results || []);
  },
  getById: async (id: string): Promise<Session> => {
    return api.get<Session>(`/sessions/${id}/`);
  },
  getActive: async (): Promise<Session | null> => {
    const sessions = await sessionsApi.getAll();
    return sessions.find((s) => s.is_active) || null;
  },
  create: async (data: Partial<Session>): Promise<Session> => {
    return api.post<Session>('/sessions/', data);
  },
  update: async (id: string, data: Partial<Session>): Promise<Session> => {
    return api.patch<Session>(`/sessions/${id}/`, data);
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/sessions/${id}/`);
  },
  lock: async (id: string): Promise<Session> => {
    return api.post<Session>(`/sessions/${id}/lock/`);
  },
  unlock: async (id: string): Promise<Session> => {
    return api.post<Session>(`/sessions/${id}/unlock/`);
  },
};
