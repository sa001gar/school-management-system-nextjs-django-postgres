'use client';

import { useState, useEffect } from 'react';
import { useStudent } from '@/stores/auth-store';
import { useSessions, useActiveSession } from '@/hooks/use-sessions';
import { useReportCard } from '@/hooks/use-report-card';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { FileDown, FileSpreadsheet, Loader2 } from 'lucide-react';

function gradeVariant(grade: string): 'success' | 'info' | 'warning' | 'danger' {
  const g = grade.toUpperCase();
  if (g.startsWith('A')) return 'success';
  if (g.startsWith('B')) return 'info';
  if (g.startsWith('C')) return 'warning';
  return 'danger';
}

export function ResultsView() {
  const student = useStudent();
  const { data: sessions = [] } = useSessions();
  const { data: activeSession } = useActiveSession();
  const [selectedSessionId, setSelectedSessionId] = useState('');

  useEffect(() => {
    if (activeSession?.id && !selectedSessionId) {
      setSelectedSessionId(activeSession.id);
    }
  }, [activeSession?.id, selectedSessionId]);

  const { data: reportCard, isLoading, error } = useReportCard(student?.id ?? '', selectedSessionId);

  const sessionOptions = sessions.map((s) => ({
    value: s.id,
    label: `${s.name}${s.is_active ? ' (Active)' : ''}`,
  }));

  const exportBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? '';

  function handleExportPdf() {
    if (!reportCard) return;
    window.open(`${exportBaseUrl}/reporting/export/pdf/student/${reportCard.student.id}/`, '_blank');
  }

  function handleExportExcel() {
    if (!reportCard) return;
    window.open(`${exportBaseUrl}/reporting/export/excel/student/${reportCard.student.id}/`, '_blank');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Results"
        description="View your exam results and report card"
        actions={
          reportCard && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportPdf}>
                <FileDown className="h-4 w-4" />
                Download Report Card (PDF)
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportExcel}>
                <FileSpreadsheet className="h-4 w-4" />
                Download Marksheet (Excel)
              </Button>
            </div>
          )
        }
      />

      <div className="max-w-xs">
        <Select
          label="Session"
          options={sessionOptions}
          placeholder="Select a session"
          value={selectedSessionId}
          onChange={(e) => setSelectedSessionId(e.target.value)}
        />
      </div>

      {!student && (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Please log in as a student to view results.</p>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
          <span className="ml-2 text-sm text-gray-500">Loading results...</span>
        </div>
      )}

      {error && (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-red-600">Failed to load results. Please try again later.</p>
          </CardContent>
        </Card>
      )}

      {reportCard && !isLoading && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Assessment Type</TableHead>
                    <TableHead className="text-right">Marks Obtained</TableHead>
                    <TableHead className="text-right">Full Marks</TableHead>
                    <TableHead className="text-right">Percentage</TableHead>
                    <TableHead>Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportCard.results.map((r, i) => {
                    const pct = r.full_marks > 0 ? ((r.marks_obtained / r.full_marks) * 100).toFixed(1) : '0.0';
                    return (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{r.subject_name}</TableCell>
                        <TableCell className="text-gray-500">{r.assessment_type ?? '—'}</TableCell>
                        <TableCell className="text-right">{r.marks_obtained}</TableCell>
                        <TableCell className="text-right">{r.full_marks}</TableCell>
                        <TableCell className="text-right">{pct}%</TableCell>
                        <TableCell>
                          <Badge variant={gradeVariant(r.grade)}>{r.grade}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {reportCard.results.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500">
                        No results found for this session.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-sm text-gray-500">Total Marks</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">
                    {reportCard.summary.total_marks}{' '}
                    <span className="text-sm font-normal text-gray-400">/ {reportCard.summary.total_full_marks}</span>
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-sm text-gray-500">Overall Percentage</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">
                    {reportCard.summary.percentage.toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-sm text-gray-500">Overall Grade</p>
                  <div className="mt-1">
                    <Badge variant={gradeVariant(reportCard.summary.overall_grade)} className="text-base px-3 py-1">
                      {reportCard.summary.overall_grade}
                    </Badge>
                  </div>
                </div>
                {reportCard.summary.rank != null && (
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Class Rank</p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                      #{reportCard.summary.rank}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
