'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AssignmentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Assignments" description="Manage teacher-class assignments" />
      <Card>
        <CardHeader>
          <CardTitle>Teacher Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Teacher assignment management coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
