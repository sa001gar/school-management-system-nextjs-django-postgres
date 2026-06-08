import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { enrollmentsApi } from '@/lib/api/enrollments';
import type { Enrollment, PaginatedResponse } from '@/types';

interface PromoteData {
  new_session?: string;
  new_class?: string;
  new_section?: string;
  remarks?: string;
}

interface RetainData {
  remarks?: string;
}

interface TransferOutData {
  transfer_school?: string;
  transfer_date?: string;
  remarks?: string;
}

interface BulkEnrollData {
  student_ids: string[];
  session_id: string;
  class_id: string;
  section_id: string;
}

export const enrollmentKeys = {
  all: ['enrollments'] as const,
  lists: () => [...enrollmentKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...enrollmentKeys.lists(), filters] as const,
  details: () => [...enrollmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...enrollmentKeys.details(), id] as const,
};

export function useEnrollments(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: enrollmentKeys.list(filters),
    queryFn: () => enrollmentsApi.getAll(filters),
    staleTime: 30 * 1000,
  });
}

export function useEnrollment(id: string) {
  return useQuery({
    queryKey: enrollmentKeys.detail(id),
    queryFn: () => enrollmentsApi.getById(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useActiveEnrollment(studentId: string, sessionId: string) {
  return useQuery({
    queryKey: [...enrollmentKeys.all, 'active', studentId, sessionId],
    queryFn: () => enrollmentsApi.getActive(studentId, sessionId),
    enabled: !!studentId && !!sessionId,
    staleTime: 30 * 1000,
  });
}

export function useCreateEnrollment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Enrollment>) => enrollmentsApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: enrollmentKeys.all }),
  });
}

export function usePromoteEnrollment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PromoteData }) => enrollmentsApi.promote(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: enrollmentKeys.all }),
  });
}

export function useRetainEnrollment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RetainData }) => enrollmentsApi.retain(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: enrollmentKeys.all }),
  });
}

export function useTransferEnrollment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TransferOutData }) => enrollmentsApi.transferOut(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: enrollmentKeys.all }),
  });
}

export function useBulkEnroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkEnrollData) => enrollmentsApi.bulkEnroll(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: enrollmentKeys.all }),
  });
}
