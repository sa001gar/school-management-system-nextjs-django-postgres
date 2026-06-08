import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marksApi } from '@/lib/api/marks';
import type { MarksEntry } from '@/types';
import { queryKeys } from './use-sessions';

export function useMarks(filters?: {
  student_id?: string;
  subject_id?: string;
  session_id?: string;
  class_id?: string;
  section_id?: string;
}) {
  return useQuery({
    queryKey: ['marks', filters],
    queryFn: () => marksApi.getAll(filters),
    staleTime: 30 * 1000,
  });
}

export function useCreateMark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MarksEntry>) => marksApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['marks'] }),
  });
}

export function useUpdateMark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MarksEntry> }) => marksApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['marks'] }),
  });
}

export function useBulkUpsertMarks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (marks: Partial<MarksEntry>[]) => marksApi.bulkUpsert(marks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marks'] });
      queryClient.invalidateQueries({ queryKey: ['results'] });
    },
  });
}
