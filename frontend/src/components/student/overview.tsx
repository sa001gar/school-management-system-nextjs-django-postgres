'use client';

import { StatsCard } from '@/components/ui/stats-card';
import { FileText, Award } from 'lucide-react';

export function StudentOverview() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatsCard title="My Results" value="View" icon={FileText} description="Check your exam results" />
        <StatsCard title="Overall Grade" value="-" icon={Award} description="Your current grade" />
      </div>
    </div>
  );
}
