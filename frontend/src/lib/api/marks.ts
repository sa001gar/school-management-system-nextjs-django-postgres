import api from './client';
import type { MarksEntry } from '@/types';

export const marksApi = {
  getAll: async (params?: {
    student_id?: string;
    subject_id?: string;
    exam_type_id?: string;
    session_id?: string;
    class_id?: string;
    section_id?: string;
  }): Promise<MarksEntry[]> => {
    const response = await api.get<{ results?: MarksEntry[] } | MarksEntry[]>('/results/subject-marks/', params);
    return Array.isArray(response) ? response : (response.results || []);
  },
  create: async (data: Partial<MarksEntry>): Promise<MarksEntry> => {
    return api.post<MarksEntry>('/results/subject-marks/', data);
  },
  update: async (id: string, data: Partial<MarksEntry>): Promise<MarksEntry> => {
    return api.patch<MarksEntry>(`/results/subject-marks/${id}/`, data);
  },
  bulkUpsert: async (marks: Partial<MarksEntry>[]): Promise<MarksEntry[]> => {
    return api.post<MarksEntry[]>('/results/subject-marks/bulk-upsert/', { marks });
  },
};
