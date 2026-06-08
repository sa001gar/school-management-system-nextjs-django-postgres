import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionsApi } from '@/lib/api/sessions';
import type { Session } from '@/types';

export const queryKeys = {
  sessions: ['sessions'] as const,
  classes: ['classes'] as const,
  sections: (classId: string) => ['sections', classId] as const,
  subjects: ['subjects'] as const,
  students: (filters?: Record<string, unknown>) => ['students', filters] as const,
  teachers: ['teachers'] as const,
  results: (filters?: Record<string, unknown>) => ['results', filters] as const,
  marksheet: (studentId: string, sessionId?: string) => ['marksheet', studentId, sessionId] as const,
};

export function useSessions() {
  return useQuery({
    queryKey: queryKeys.sessions,
    queryFn: sessionsApi.getAll,
    staleTime: 5 * 60 * 1000,
  });
}

export function useActiveSession() {
  return useQuery({
    queryKey: [...queryKeys.sessions, 'active'],
    queryFn: sessionsApi.getActive,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Session>) => sessionsApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.sessions }),
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Session> }) => sessionsApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.sessions }),
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sessionsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.sessions }),
  });
}

export function useLockSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sessionsApi.lock(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.sessions }),
  });
}
