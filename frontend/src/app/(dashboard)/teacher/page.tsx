'use client';

import { useTeacherDashboard } from '@/hooks/use-dashboard';
import { useSessions } from '@/hooks/use-sessions';
import { StatsCard } from '@/components/ui/stats-card';
import { Users, BookOpen, FileText, ClipboardList } from 'lucide-react';

export default function TeacherDashboardPage() {
  const { data: dashboard, isLoading, error } = useTeacherDashboard();
  const { data: sessions = [] } = useSessions();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="text-gray-500">Loading dashboard data...</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="text-red-500">Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  const activeSession = sessions.find((s) => s.is_active);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
        <p className="text-gray-500">Welcome to the teacher portal</p>
      </div>

      {activeSession && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Active Session: <span className="font-semibold">{activeSession.name}</span>
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="My Subjects"
          value={dashboard?.total_assigned_subjects || 0}
          icon={BookOpen}
          description="Subjects assigned"
        />
        <StatsCard
          title="My Classes"
          value={dashboard?.class_teacher_of?.length || 0}
          icon={Users}
          description="Class teacher of"
        />
        <StatsCard
          title="Marks Entered"
          value={dashboard?.marks_entered || 0}
          icon={FileText}
          description="This session"
        />
      </div>

      {dashboard?.assigned_subjects && dashboard.assigned_subjects.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Assigned Subjects</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Class
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Section
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Subject
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dashboard.assigned_subjects.map((subject) => (
                  <tr key={subject.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{subject.class_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{subject.section_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{subject.subject_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {dashboard?.class_teacher_of && dashboard.class_teacher_of.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Class Teacher Of</h2>
          <div className="space-y-3">
            {dashboard.class_teacher_of.map((cls) => (
              <div key={cls.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <ClipboardList className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">
                  {cls.class_name} - {cls.section_name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
