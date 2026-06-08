import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gradePoliciesApi } from '@/lib/api/grade-policies';

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

export const gradePolicyKeys = {
  all: ['gradePolicies'] as const,
};

export function useGradePolicies() {
  return useQuery({
    queryKey: gradePolicyKeys.all,
    queryFn: () => gradePoliciesApi.getAll(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateGradePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<GradePolicy>) => gradePoliciesApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: gradePolicyKeys.all }),
  });
}

export function useUpdateGradePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<GradePolicy> }) => gradePoliciesApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: gradePolicyKeys.all }),
  });
}

export function useDeleteGradePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => gradePoliciesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: gradePolicyKeys.all }),
  });
}
