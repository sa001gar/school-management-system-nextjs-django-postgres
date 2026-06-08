import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resultsApi, type StudentResult } from '@/lib/api/results';
import { queryKeys } from './use-sessions';

export function useResults(filters?: {
  student_id?: string;
  subject_id?: string;
  session_id?: string;
}) {
  return useQuery({
    queryKey: queryKeys.results(filters),
    queryFn: () => resultsApi.getAll(filters),
    staleTime: 30 * 1000,
  });
}

export function useResultsByClassSection(params: {
  session_id: string;
  class_id: string;
  section_id: string;
  subject_id: string;
}) {
  return useQuery({
    queryKey: ['results', 'by-class-section', params],
    queryFn: () => resultsApi.getByClassSection(params),
    enabled: !!params.session_id && !!params.class_id && !!params.section_id && !!params.subject_id,
    staleTime: 30 * 1000,
  });
}

export function useComputeResults() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { session_id: string; class_id: string; section_id: string }) => resultsApi.compute(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['results'] }),
  });
}
