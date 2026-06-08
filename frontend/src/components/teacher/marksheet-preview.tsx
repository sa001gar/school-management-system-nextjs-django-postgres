'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';

export function MarksheetPreview() {
  return (
    <div className="space-y-6">
      <PageHeader title="Marksheet" description="Preview and generate marksheets" />
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">Select a class and section to generate marksheets.</p>
        </CardContent>
      </Card>
    </div>
  );
}
