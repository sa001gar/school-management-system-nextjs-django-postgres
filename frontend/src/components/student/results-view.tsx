'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';

export function ResultsView() {
  return (
    <div className="space-y-6">
      <PageHeader title="My Results" description="View your exam results" />
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">Your results will appear here once published.</p>
        </CardContent>
      </Card>
    </div>
  );
}
