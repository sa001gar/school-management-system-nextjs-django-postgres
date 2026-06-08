'use client';

import { useStudentDashboard } from '@/hooks/use-dashboard';
import { StatsCard } from '@/components/ui/stats-card';
import { FileText, Award, TrendingUp, Users } from 'lucide-react';

export default function StudentDashboardPage() {
  const { data: dashboard, isLoading, error } = useStudentDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-500">Loading dashboard data...</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
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
          <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-red-500">Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
        <p className="text-gray-500">Welcome to the student portal</p>
      </div>

      {dashboard?.current_class && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Current Class: <span className="font-semibold">
              {dashboard.current_class} - {dashboard.current_section}
            </span>
            {dashboard.roll_no && (
              <span className="ml-4">Roll No: <span className="font-semibold">{dashboard.roll_no}</span></span>
            )}
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <StatsCard
          title="Percentage"
          value={dashboard?.percentage != null ? `${dashboard.percentage}%` : '-'}
          icon={TrendingUp}
          description="Your overall percentage"
        />
        <StatsCard
          title="Grade"
          value={dashboard?.grade || '-'}
          icon={Award}
          description="Your overall grade"
        />
        <StatsCard
          title="Class Rank"
          value={dashboard?.rank != null ? `${dashboard.rank}/${dashboard.total_students}` : '-'}
          icon={Users}
          description="Your position in class"
        />
        <StatsCard
          title="Subjects"
          value={dashboard?.subject_performance?.length || 0}
          icon={FileText}
          description="Subjects with results"
        />
      </div>

      {dashboard?.subject_performance && dashboard.subject_performance.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Subject Performance</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Subject
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Marks
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Max
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Percentage
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Grade
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dashboard.subject_performance.map((subject, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm text-gray-900">{subject.subject}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{subject.marks_obtained}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{subject.max_marks}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{subject.percentage}%</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{subject.grade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
