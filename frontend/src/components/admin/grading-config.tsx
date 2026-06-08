'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function GradingConfig() {
  return (
    <div className="space-y-6">
      <PageHeader title="Grade Policy" description="Configure grading rules" />
      <Card>
        <CardHeader>
          <CardTitle>Grade Boundaries</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Define grade boundaries (e.g., A+: 90-100%, A: 80-89%).</p>
        </CardContent>
      </Card>
    </div>
  );
}
