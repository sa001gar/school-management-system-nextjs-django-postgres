import api from './client';

export interface AssessmentCategory {
  id: string;
  name: string;
  code: string;
  category_type: string;
  is_active: boolean;
  created_at: string;
}

export interface MarksDistribution {
  id: string;
  class_id: string;
  assessment_category_id: string;
  full_marks: number;
  created_at: string;
}

export const assessmentsApi = {
  getCategories: async (): Promise<AssessmentCategory[]> => {
    const response = await api.get<{ results?: AssessmentCategory[] } | AssessmentCategory[]>('/assessment-categories/');
    return Array.isArray(response) ? response : (response.results || []);
  },
  createCategory: async (data: Partial<AssessmentCategory>): Promise<AssessmentCategory> => {
    return api.post<AssessmentCategory>('/assessment-categories/', data);
  },
  updateCategory: async (id: string, data: Partial<AssessmentCategory>): Promise<AssessmentCategory> => {
    return api.patch<AssessmentCategory>(`/assessment-categories/${id}/`, data);
  },
  deleteCategory: async (id: string): Promise<void> => {
    await api.delete(`/assessment-categories/${id}/`);
  },
  getMarksDistribution: async (classId?: string): Promise<MarksDistribution[]> => {
    const response = await api.get<{ results?: MarksDistribution[] } | MarksDistribution[]>('/core-marks-distribution/', classId ? { class_id: classId } : undefined);
    return Array.isArray(response) ? response : (response.results || []);
  },
  bulkUpdateMarksDistribution: async (data: { class_id: string; distributions: Array<{ assessment_category_id: string; full_marks: number }> }): Promise<MarksDistribution[]> => {
    return api.post<MarksDistribution[]>('/core-marks-distribution/bulk-update/', data);
  },
};
