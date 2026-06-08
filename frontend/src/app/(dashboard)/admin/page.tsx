'use client';

import { useSessions } from '@/hooks/use-sessions';
import { useTeachers } from '@/hooks/use-teachers';
import { useStudents } from '@/hooks/use-students';
import { useClasses } from '@/hooks/use-classes';
import { StatsCard } from '@/components/ui/stats-card';
import { Users, UserCheck, GraduationCap, Calendar } from 'lucide-react';

export default function AdminDashboardPage() {
  const { data: sessions = [] } = useSessions();
  const { data: teachers = [] } = useTeachers();
  const { data: studentsData } = useStudents();
  const { data: classes = [] } = useClasses();

  const activeSession = sessions.find((s) => s.is_active);
  const totalStudents = studentsData?.count || 0;

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
        <StatsCard title="Total Students" value={totalStudents} icon={Users} />
        <StatsCard title="Teachers" value={teachers.length} icon={UserCheck} />
        <StatsCard title="Classes" value={classes.length} icon={GraduationCap} />
        <StatsCard title="Sessions" value={sessions.length} icon={Calendar} />
      </div>
    </div>
  );
}
