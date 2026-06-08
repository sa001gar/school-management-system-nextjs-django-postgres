import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assessmentsApi } from '@/lib/api/assessments';
import type { AssessmentCategory, MarksDistribution } from '@/lib/api/assessments';

export const assessmentKeys = {
  all: ['assessments'] as const,
  categories: () => [...assessmentKeys.all, 'categories'] as const,
  marksDistribution: (classId?: string) => [...assessmentKeys.all, 'marksDistribution', classId] as const,
};

export function useAssessmentCategories() {
  return useQuery({
    queryKey: assessmentKeys.categories(),
    queryFn: () => assessmentsApi.getCategories(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateAssessmentCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AssessmentCategory>) => assessmentsApi.createCategory(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: assessmentKeys.categories() }),
  });
}

export function useUpdateAssessmentCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AssessmentCategory> }) =>
      assessmentsApi.updateCategory(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: assessmentKeys.categories() }),
  });
}

export function useDeleteAssessmentCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assessmentsApi.deleteCategory(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: assessmentKeys.categories() }),
  });
}

export function useMarksDistribution(classId?: string) {
  return useQuery({
    queryKey: assessmentKeys.marksDistribution(classId),
    queryFn: () => assessmentsApi.getMarksDistribution(classId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBulkUpdateMarksDistribution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { class_id: string; distributions: Array<{ assessment_category_id: string; full_marks: number }> }) =>
      assessmentsApi.bulkUpdateMarksDistribution(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: assessmentKeys.all }),
  });
}
