'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TeacherMarksPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Marks Entry" description="Enter student marks for your assigned subjects" />
      <Card>
        <CardHeader>
          <CardTitle>Marks Entry Form</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Select a class, section, and subject to enter marks.</p>
        </CardContent>
      </Card>
    </div>
  );
}
