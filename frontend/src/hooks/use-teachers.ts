import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teachersApi, type Teacher } from '@/lib/api/teachers';
import { queryKeys } from './use-sessions';

export function useTeachers() {
  return useQuery({
    queryKey: queryKeys.teachers,
    queryFn: teachersApi.getAll,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { email: string; password: string; name: string }) => teachersApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.teachers }),
  });
}

export function useDeleteTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => teachersApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.teachers }),
  });
}

export function useResetTeacherPassword() {
  return useMutation({
    mutationFn: (id: string) => teachersApi.resetPassword(id),
  });
}
