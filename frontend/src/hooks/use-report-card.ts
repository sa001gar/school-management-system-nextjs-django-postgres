import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api/reports';
import { queryKeys } from './use-sessions';

export function useReportCard(studentId: string, sessionId?: string) {
  return useQuery({
    queryKey: queryKeys.marksheet(studentId, sessionId),
    queryFn: () => reportsApi.getReportCard(studentId, sessionId),
    enabled: !!studentId,
    staleTime: 60 * 1000,
  });
}

export function useClassReportCards(sessionId: string, classId: string, sectionId: string) {
  return useQuery({
    queryKey: ['report-cards', sessionId, classId, sectionId],
    queryFn: () => reportsApi.getClassReportCards(sessionId, classId, sectionId),
    enabled: !!sessionId && !!classId && !!sectionId,
    staleTime: 60 * 1000,
  });
}

export function useMarksheet(studentId: string, sessionId?: string) {
  return useQuery({
    queryKey: ['marksheet', studentId, sessionId],
    queryFn: () => reportsApi.getMarksheet(studentId, sessionId),
    enabled: !!studentId,
    staleTime: 60 * 1000,
  });
}

export function useRankings(sessionId: string, classId: string, sectionId: string) {
  return useQuery({
    queryKey: ['rankings', sessionId, classId, sectionId],
    queryFn: () => reportsApi.getRankings(sessionId, classId, sectionId),
    enabled: !!sessionId && !!classId && !!sectionId,
    staleTime: 60 * 1000,
  });
}
