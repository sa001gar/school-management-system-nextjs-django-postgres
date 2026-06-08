'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AssessmentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Assessments" description="Configure assessment types and weightages" />
      <Card>
        <CardHeader>
          <CardTitle>Assessment Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Assessment type management coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
