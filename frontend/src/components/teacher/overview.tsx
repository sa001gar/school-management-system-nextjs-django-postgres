'use client';

import { StatsCard } from '@/components/ui/stats-card';
import { BookOpen, FileText, Users } from 'lucide-react';

export function TeacherOverview() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard title="My Subjects" value={0} icon={BookOpen} description="Subjects assigned" />
        <StatsCard title="My Classes" value={0} icon={Users} description="Classes assigned" />
        <StatsCard title="Marks Entered" value={0} icon={FileText} description="This session" />
      </div>
    </div>
  );
}
