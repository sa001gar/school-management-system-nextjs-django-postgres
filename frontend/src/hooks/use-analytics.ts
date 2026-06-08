import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api/client';

export interface PassFailData {
  total: number;
  passed: number;
  failed: number;
  pass_percentage: number;
  fail_percentage: number;
}

export interface SubjectDifficultyData {
  subject: string;
  subject_id: string;
  avg_percentage: number;
  total_students: number;
  pass_count: number;
  pass_rate: number;
}

export interface GradeDistributionData {
  [grade: string]: number;
}

export interface PerformerData {
  student_name: string;
  student_id: string;
  class_name: string;
  percentage: number;
  total_obtained: number;
  total_full: number;
}

export interface SessionComparisonData {
  session_name: string;
  session_id: string;
  total_students: number;
  total: number;
  passed: number;
  failed: number;
  pass_percentage: number;
  fail_percentage: number;
}

export interface ClassPerformanceData {
  class_name: string;
  class_id: string;
  student_count: number;
  avg_percentage: number;
}

export function usePassFailRatio(sessionId: string, classId?: string) {
  return useQuery<PassFailData>({
    queryKey: ['analytics', 'pass-fail', sessionId, classId],
    queryFn: () => api.get<PassFailData>('/analytics/pass-fail/', {
      session_id: sessionId,
      ...(classId && { class_id: classId }),
    }),
    enabled: !!sessionId,
  });
}

export function useSubjectDifficulty(sessionId: string, classId?: string) {
  return useQuery<SubjectDifficultyData[]>({
    queryKey: ['analytics', 'subject-difficulty', sessionId, classId],
    queryFn: () => api.get<SubjectDifficultyData[]>('/analytics/subject-difficulty/', {
      session_id: sessionId,
      ...(classId && { class_id: classId }),
    }),
    enabled: !!sessionId,
  });
}

export function useGradeDistribution(sessionId: string, classId?: string) {
  return useQuery<GradeDistributionData>({
    queryKey: ['analytics', 'grade-distribution', sessionId, classId],
    queryFn: () => api.get<GradeDistributionData>('/analytics/grade-distribution/', {
      session_id: sessionId,
      ...(classId && { class_id: classId }),
    }),
    enabled: !!sessionId,
  });
}

export function useTopPerformers(sessionId: string, classId?: string, limit = 10) {
  return useQuery<PerformerData[]>({
    queryKey: ['analytics', 'top-performers', sessionId, classId, limit],
    queryFn: () => api.get<PerformerData[]>('/analytics/top-performers/', {
      session_id: sessionId,
      ...(classId && { class_id: classId }),
      limit,
    }),
    enabled: !!sessionId,
  });
}

export function useBottomPerformers(sessionId: string, classId?: string, limit = 10) {
  return useQuery<PerformerData[]>({
    queryKey: ['analytics', 'bottom-performers', sessionId, classId, limit],
    queryFn: () => api.get<PerformerData[]>('/analytics/bottom-performers/', {
      session_id: sessionId,
      ...(classId && { class_id: classId }),
      limit,
    }),
    enabled: !!sessionId,
  });
}

export function useSessionComparison(sessionIds: string[]) {
  return useQuery<SessionComparisonData[]>({
    queryKey: ['analytics', 'session-comparison', sessionIds],
    queryFn: () => api.get<SessionComparisonData[]>('/analytics/session-comparison/', {
      session_ids: sessionIds,
    }),
    enabled: sessionIds.length >= 2,
  });
}

export function useClassPerformance(sessionId: string) {
  return useQuery<ClassPerformanceData[]>({
    queryKey: ['analytics', 'class-performance', sessionId],
    queryFn: () => api.get<ClassPerformanceData[]>('/analytics/class-performance/', {
      session_id: sessionId,
    }),
    enabled: !!sessionId,
  });
}
