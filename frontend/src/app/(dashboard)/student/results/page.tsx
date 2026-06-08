'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function StudentResultsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="My Results" description="View your exam results" />
      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Your results will appear here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
