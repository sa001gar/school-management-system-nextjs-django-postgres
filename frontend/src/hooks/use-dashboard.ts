import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api/client';
import type { AdminDashboardData, TeacherDashboardData, StudentDashboardData } from '@/types/dashboard';

export type { AdminDashboardData, TeacherDashboardData, StudentDashboardData };

export function useAdminDashboard() {
  return useQuery<AdminDashboardData>({
    queryKey: ['dashboard', 'admin'],
    queryFn: () => api.get<AdminDashboardData>('/dashboard/admin/'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTeacherDashboard() {
  return useQuery<TeacherDashboardData>({
    queryKey: ['dashboard', 'teacher'],
    queryFn: () => api.get<TeacherDashboardData>('/dashboard/teacher/'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useStudentDashboard() {
  return useQuery<StudentDashboardData>({
    queryKey: ['dashboard', 'student'],
    queryFn: () => api.get<StudentDashboardData>('/dashboard/student/'),
    staleTime: 5 * 60 * 1000,
  });
}
