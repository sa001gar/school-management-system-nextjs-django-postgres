import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classTeachersApi } from '@/lib/api/class-teachers';

interface ClassTeacher {
  id: string;
  teacher: string;
  class_assigned: string;
  section: string;
  session: string;
  created_at: string;
  updated_at: string;
}

export const classTeacherKeys = {
  all: ['classTeachers'] as const,
  lists: () => [...classTeacherKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...classTeacherKeys.lists(), filters] as const,
  bySession: (sessionId: string) => [...classTeacherKeys.all, 'bySession', sessionId] as const,
};

export function useClassTeachers(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: classTeacherKeys.list(filters),
    queryFn: () => classTeachersApi.getAll(filters),
    staleTime: 30 * 1000,
  });
}

export function useClassTeachersBySession(sessionId: string) {
  return useQuery({
    queryKey: classTeacherKeys.bySession(sessionId),
    queryFn: () => classTeachersApi.listBySession(sessionId),
    enabled: !!sessionId,
    staleTime: 30 * 1000,
  });
}

export function useCreateClassTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ClassTeacher>) => classTeachersApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: classTeacherKeys.all }),
  });
}

export function useDeleteClassTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => classTeachersApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: classTeacherKeys.all }),
  });
}
