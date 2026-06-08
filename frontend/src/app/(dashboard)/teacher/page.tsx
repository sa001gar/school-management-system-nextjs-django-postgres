'use client';

import { useSessions } from '@/hooks/use-sessions';
import { useTeachers } from '@/hooks/use-teachers';
import { useStudents } from '@/hooks/use-students';
import { StatsCard } from '@/components/ui/stats-card';
import { Users, BookOpen, FileText } from 'lucide-react';

export default function TeacherDashboardPage() {
  const { data: sessions = [] } = useSessions();
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
        <StatsCard title="My Subjects" value={0} icon={BookOpen} description="Subjects assigned" />
        <StatsCard title="My Classes" value={0} icon={Users} description="Classes assigned" />
        <StatsCard title="Marks Entered" value={0} icon={FileText} description="This session" />
      </div>
    </div>
  );
}
