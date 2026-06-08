'use client';

import { useStudents } from '@/hooks/use-students';
import { StatsCard } from '@/components/ui/stats-card';
import { FileText, Award } from 'lucide-react';

export default function StudentDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
        <p className="text-gray-500">Welcome to the student portal</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <StatsCard title="My Results" value="View" icon={FileText} description="Check your exam results" />
        <StatsCard title="Overall Grade" value="-" icon={Award} description="Your current grade" />
      </div>
    </div>
  );
}
