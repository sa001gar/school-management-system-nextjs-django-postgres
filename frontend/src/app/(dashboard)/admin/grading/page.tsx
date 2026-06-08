'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function GradingPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Grading" description="Configure grade policies" />
      <Card>
        <CardHeader>
          <CardTitle>Grade Policy</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Grade policy configuration coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
