'use client';

import { useAdminDashboard } from '@/hooks/use-dashboard';
import { useSessions } from '@/hooks/use-sessions';
import { StatsCard } from '@/components/ui/stats-card';
import { Users, UserCheck, GraduationCap, Calendar, TrendingUp, AlertTriangle } from 'lucide-react';

export default function AdminDashboardPage() {
  const { data: dashboard, isLoading, error } = useAdminDashboard();
  const { data: sessions = [] } = useSessions();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Loading dashboard data...</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-red-500">Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  const activeSession = dashboard?.active_session;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome to the admin dashboard</p>
      </div>

      {activeSession && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            Active Session: <span className="font-semibold">{activeSession.name}</span>
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Students"
          value={dashboard?.total_students || 0}
          icon={Users}
          description="Active students"
        />
        <StatsCard
          title="Teachers"
          value={dashboard?.total_teachers || 0}
          icon={UserCheck}
          description="Active teachers"
        />
        <StatsCard
          title="Classes"
          value={dashboard?.total_classes || 0}
          icon={GraduationCap}
          description="Active classes"
        />
        <StatsCard
          title="Sessions"
          value={dashboard?.total_sessions || 0}
          icon={Calendar}
          description="Total sessions"
        />
      </div>

      {dashboard?.enrollment_stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Enrolled"
            value={dashboard.enrollment_stats.total}
            icon={Users}
            description="This session"
          />
          <StatsCard
            title="Promoted"
            value={dashboard.enrollment_stats.promoted}
            icon={TrendingUp}
            description="Promoted students"
          />
          <StatsCard
            title="Retained"
            value={dashboard.enrollment_stats.retained}
            icon={AlertTriangle}
            description="Retained students"
          />
          <StatsCard
            title="Transferred"
            value={dashboard.enrollment_stats.transferred}
            icon={Users}
            description="Transferred out"
          />
        </div>
      )}

      {dashboard?.class_distribution && dashboard.class_distribution.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Class-wise Distribution</h2>
          <div className="space-y-3">
            {dashboard.class_distribution.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.class_field__name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(
                          (item.student_count / Math.max(...(dashboard.class_distribution ?? []).map(c => c.student_count))) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12 text-right">
                    {item.student_count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {dashboard?.recent_activity && dashboard.recent_activity.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {dashboard.recent_activity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.entity_type}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {new Date(activity.created_at).toLocaleDateString()}
                  </p>
                  {activity.user && (
                    <p className="text-xs text-gray-400">by {activity.user}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
