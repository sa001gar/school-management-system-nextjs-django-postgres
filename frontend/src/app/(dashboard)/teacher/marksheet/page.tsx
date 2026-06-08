'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TeacherMarksheetPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Marksheet" description="Generate and view class marksheets" />
      <Card>
        <CardHeader>
          <CardTitle>Marksheet Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Select a class and section to generate marksheets.</p>
        </CardContent>
      </Card>
    </div>
  );
}
