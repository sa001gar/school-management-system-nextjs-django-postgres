'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AssignmentForm() {
  return (
    <div className="space-y-6">
      <PageHeader title="Teacher Assignments" description="Assign teachers to classes and subjects" />
      <Card>
        <CardHeader>
          <CardTitle>Assign Teacher</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Assign teachers to classes and subjects for the current session.</p>
        </CardContent>
      </Card>
    </div>
  );
}
