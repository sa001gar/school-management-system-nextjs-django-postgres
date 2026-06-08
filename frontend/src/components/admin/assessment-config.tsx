'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AssessmentConfig() {
  return (
    <div className="space-y-6">
      <PageHeader title="Assessment Configuration" description="Manage assessment types and weightages" />
      <Card>
        <CardHeader>
          <CardTitle>Assessment Types</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Configure assessment types (e.g., Mid-term, Final, Unit Test).</p>
        </CardContent>
      </Card>
    </div>
  );
}
