'use client';

import { useSessions } from '@/hooks/use-sessions';
import { useTeachers } from '@/hooks/use-teachers';
import { useStudents } from '@/hooks/use-students';
import { useClasses } from '@/hooks/use-classes';
import { StatsCard } from '@/components/ui/stats-card';
import { Loading } from '@/components/ui/loading';
import { Users, UserCheck, GraduationCap, Calendar } from 'lucide-react';

export function AdminOverview() {
  const { data: sessions = [], isLoading: sessionsLoading } = useSessions();
  const { data: teachers = [], isLoading: teachersLoading } = useTeachers();
  const { data: studentsData, isLoading: studentsLoading } = useStudents();
  const { data: classes = [], isLoading: classesLoading } = useClasses();

  if (sessionsLoading || teachersLoading || studentsLoading || classesLoading) {
    return <Loading />;
  }

  const activeSession = sessions.find((s) => s.is_active);

  return (
    <div className="space-y-6">
      {activeSession && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            Active Session: <span className="font-semibold">{activeSession.name}</span>
          </p>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Students" value={studentsData?.count || 0} icon={Users} />
        <StatsCard title="Teachers" value={teachers.length} icon={UserCheck} />
        <StatsCard title="Classes" value={classes.length} icon={GraduationCap} />
        <StatsCard title="Sessions" value={sessions.length} icon={Calendar} />
      </div>
    </div>
  );
}
