import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teacherAssignmentsApi } from '@/lib/api/teacher-assignments';

interface TeacherAssignment {
  id: string;
  teacher: string;
  subject: string;
  class_assigned: string;
  section: string;
  session: string;
  created_at: string;
  updated_at: string;
}

export const teacherAssignmentKeys = {
  all: ['teacherAssignments'] as const,
  lists: () => [...teacherAssignmentKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...teacherAssignmentKeys.lists(), filters] as const,
};

export function useTeacherAssignments(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: teacherAssignmentKeys.list(filters),
    queryFn: () => teacherAssignmentsApi.getAll(filters),
    staleTime: 30 * 1000,
  });
}

export function useCreateTeacherAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TeacherAssignment>) => teacherAssignmentsApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: teacherAssignmentKeys.all }),
  });
}

export function useDeleteTeacherAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => teacherAssignmentsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: teacherAssignmentKeys.all }),
  });
}
