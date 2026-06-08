import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentsApi } from '@/lib/api/students';
import type { Student, PaginatedResponse } from '@/types';
import { queryKeys } from './use-sessions';

export function useStudents(filters?: {
  class_id?: string;
  section_id?: string;
  session_id?: string;
  search?: string;
  page?: number;
}) {
  return useQuery({
    queryKey: queryKeys.students(filters),
    queryFn: () => studentsApi.getAll(filters),
    staleTime: 30 * 1000,
  });
}

export function useStudentsByFilters(sessionId: string, classId: string, sectionId: string) {
  return useQuery({
    queryKey: [...queryKeys.students(), { sessionId, classId, sectionId }],
    queryFn: () => studentsApi.getByFilters(sessionId, classId, sectionId),
    enabled: !!sessionId && !!classId && !!sectionId,
    staleTime: 30 * 1000,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Student>) => studentsApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] }),
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Student> }) => studentsApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] }),
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => studentsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] }),
  });
}

export function useBulkCreateStudents() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (students: Partial<Student>[]) => studentsApi.bulkCreate(students),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] }),
  });
}
