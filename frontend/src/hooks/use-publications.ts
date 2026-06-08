import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';
import type { ResultPublication, PublicationSummary } from '@/types/publication';

export type { ResultPublication, PublicationSummary };

export function usePublications(sessionId: string) {
  return useQuery<ResultPublication[]>({
    queryKey: ['publications', sessionId],
    queryFn: () => api.get<ResultPublication[]>('/results/publications/', { session_id: sessionId }),
    enabled: !!sessionId,
  });
}

export function usePublicationSummary(sessionId: string) {
  return useQuery<PublicationSummary>({
    queryKey: ['publications', 'summary', sessionId],
    queryFn: () => api.get<PublicationSummary>('/results/publications/summary/', { session_id: sessionId }),
    enabled: !!sessionId,
  });
}

export function useCreatePublication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { session_id: string; class_id: string; section_id: string; remarks?: string }) =>
      api.post<ResultPublication>('/results/publications/', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['publications', variables.session_id] });
    },
  });
}

export function useSubmitForReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (publicationId: string) =>
      api.post(`/results/publications/${publicationId}/submit/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publications'] });
    },
  });
}

export function usePublishResults() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (publicationId: string) =>
      api.post(`/results/publications/${publicationId}/publish/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useUnpublishResults() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (publicationId: string) =>
      api.post(`/results/publications/${publicationId}/unpublish/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publications'] });
    },
  });
}
