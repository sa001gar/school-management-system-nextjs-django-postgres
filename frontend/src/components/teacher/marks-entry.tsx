'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';

export function MarksEntry() {
  return (
    <div className="space-y-6">
      <PageHeader title="Marks Entry" description="Enter student marks" />
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">Select a class, section, and subject to enter marks for students.</p>
        </CardContent>
      </Card>
    </div>
  );
}
