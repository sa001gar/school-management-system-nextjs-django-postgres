import api from './client';

interface GradePolicy {
  id: string;
  grade_name: string;
  min_mark: number;
  max_mark: number;
  grade_point?: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export const gradePoliciesApi = {
  getAll: async (): Promise<GradePolicy[]> => {
    return api.get<GradePolicy[]>('/academics/grade-policies/');
  },
  create: async (data: Partial<GradePolicy>): Promise<GradePolicy> => {
    return api.post<GradePolicy>('/academics/grade-policies/', data);
  },
  update: async (id: string, data: Partial<GradePolicy>): Promise<GradePolicy> => {
    return api.put<GradePolicy>(`/academics/grade-policies/${id}/`, data);
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/academics/grade-policies/${id}/`);
  },
};
