'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { useActiveSession, useSessions } from '@/hooks/use-sessions';
import { useClasses, useSections } from '@/hooks/use-classes';
import { useSubjects } from '@/hooks/use-subjects';
import { useBulkUpsertMarks } from '@/hooks/use-marks';
import { enrollmentsApi } from '@/lib/api/enrollments';
import { assessmentsApi } from '@/lib/api/assessments';
import { marksApi } from '@/lib/api/marks';
import api from '@/lib/api/client';
import { Loader2, Save, Send, Eraser, Hash } from 'lucide-react';

interface AssessmentTypeItem {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
}

interface EnrollmentItem {
  id: string;
  student: string;
  student_name: string;
  session: string;
  class_field: string;
  section: string;
  roll_no: string;
  status: string;
}

interface MarksRow {
  enrollment_id: string;
  student_name: string;
  roll_no: string;
  marks_obtained: number;
  full_marks: number;
  remarks: string;
  existing_mark_id?: string;
}

export function MarksEntry() {
  const { data: sessions } = useSessions();
  const { data: activeSession } = useActiveSession();
  const { data: classes } = useClasses();
  const { data: subjects } = useSubjects();

  const [sessionId, setSessionId] = useState('');
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [assessmentTypeId, setAssessmentTypeId] = useState('');

  const { data: sections } = useSections(classId);
  const { data: assessmentTypes } = useQuery<AssessmentTypeItem[]>({
    queryKey: ['assessment-types'],
    queryFn: async () => {
      const response = await api.get<AssessmentTypeItem[] | { results?: AssessmentTypeItem[] }>(
        '/academics/assessment-types/',
      );
      return Array.isArray(response) ? response : (response.results || []);
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: weightages } = useQuery({
    queryKey: ['assessment-weightages', classId, subjectId],
    queryFn: () => assessmentsApi.getWeightages(classId, subjectId),
    enabled: !!classId && !!subjectId,
    staleTime: 5 * 60 * 1000,
  });

  const [marksRows, setMarksRows] = useState<MarksRow[]>([]);
  const [studentsLoaded, setStudentsLoaded] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<number, string>>({});
  const bulkUpsert = useBulkUpsertMarks();

  useEffect(() => {
    if (activeSession && !sessionId) {
      setSessionId(activeSession.id);
    }
  }, [activeSession, sessionId]);

  const resetSelections = () => {
    setClassId('');
    setSectionId('');
    setSubjectId('');
    setAssessmentTypeId('');
    setMarksRows([]);
    setStudentsLoaded(false);
    setLastSaved(null);
    setValidationErrors({});
  };

  const getFullMarksForAssessment = useCallback(
    (atId: string) => {
      if (weightages) {
        const w = weightages.find((w) => w.assessment_type_id === atId);
        if (w) return w.full_marks;
      }
      const subject = subjects?.find((s) => s.id === subjectId);
      return subject?.full_marks || 100;
    },
    [weightages, subjectId, subjects],
  );

  const handleLoadStudents = async () => {
    if (!sessionId || !classId || !sectionId || !subjectId || !assessmentTypeId) return;
    setLoadingStudents(true);
    setValidationErrors({});

    try {
      const enrollmentResponse = await enrollmentsApi.getAll({
        session: sessionId,
        class_field: classId,
        section: sectionId,
        status: 'active',
      });
      const enrollments = (enrollmentResponse.results || []) as unknown as EnrollmentItem[];
      const filtered = enrollments.filter(
        (e) =>
          e.session === sessionId &&
          e.class_field === classId &&
          e.section === sectionId &&
          e.status === 'active',
      );

      const fullMarks = getFullMarksForAssessment(assessmentTypeId);

      let existingMarks: Array<{
        id: string;
        enrollment: string;
        subject: string;
        assessment_type: string;
        obtained_marks: number;
        full_marks: number;
        remarks: string;
      }> = [];
      try {
        const marksResponse = await marksApi.getAll({
          subject_id: subjectId,
          exam_type_id: assessmentTypeId,
        });
        existingMarks = (marksResponse || []) as unknown as typeof existingMarks;
      } catch {
        // No existing marks
      }

      const rows: MarksRow[] = filtered
        .sort((a, b) => {
          const ra = parseInt(a.roll_no) || 0;
          const rb = parseInt(b.roll_no) || 0;
          return ra - rb;
        })
        .map((e) => {
          const existing = existingMarks.find(
            (m) => m.enrollment === e.id && m.subject === subjectId,
          );
          return {
            enrollment_id: e.id,
            student_name: e.student_name,
            roll_no: e.roll_no,
            marks_obtained: existing?.obtained_marks ?? 0,
            full_marks: existing?.full_marks ?? fullMarks,
            remarks: existing?.remarks || '',
            existing_mark_id: existing?.id,
          };
        });

      setMarksRows(rows);
      setStudentsLoaded(true);
    } catch {
      // Handle error silently
    } finally {
      setLoadingStudents(false);
    }
  };

  const validateMarks = (): boolean => {
    const errors: Record<number, string> = {};
    marksRows.forEach((row, index) => {
      if (row.marks_obtained < 0) {
        errors[index] = 'Marks cannot be negative';
      } else if (row.marks_obtained > row.full_marks) {
        errors[index] = `Marks cannot exceed ${row.full_marks}`;
      }
    });
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildPayload = (isDraft: boolean) => {
    return marksRows
      .filter((row) => {
        if (isDraft) return true;
        return row.marks_obtained > 0 || row.remarks;
      })
      .map((row) => ({
        enrollment_id: row.enrollment_id,
        subject_id: subjectId,
        assessment_type_id: assessmentTypeId,
        full_marks: row.full_marks,
        obtained_marks: row.marks_obtained,
        remarks: row.remarks,
      }));
  };

  const handleSaveDraft = async () => {
    const payload = buildPayload(true);
    if (payload.length === 0) return;

    try {
      await bulkUpsert.mutateAsync(payload as Parameters<typeof bulkUpsert.mutateAsync>[0]);
      setLastSaved(new Date());
    } catch {
      // Error handled by mutation
    }
  };

  const handleSubmitMarks = async () => {
    if (!validateMarks()) return;

    const payload = buildPayload(false);
    if (payload.length === 0) return;

    try {
      await bulkUpsert.mutateAsync(payload as Parameters<typeof bulkUpsert.mutateAsync>[0]);
      setLastSaved(new Date());
    } catch {
      // Error handled by mutation
    }
  };

  const handleSetAll = (value: number) => {
    setMarksRows((prev) =>
      prev.map((row) => ({
        ...row,
        marks_obtained: Math.min(value, row.full_marks),
      })),
    );
    setValidationErrors({});
  };

  const handleClearAll = () => {
    setMarksRows((prev) => prev.map((row) => ({ ...row, marks_obtained: 0, remarks: '' })));
    setValidationErrors({});
  };

  const updateMarks = (index: number, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value, 10);
    if (isNaN(numValue) && value !== '') return;

    setMarksRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, marks_obtained: numValue } : row)),
    );

    if (validationErrors[index]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    }
  };

  const updateRemarks = (index: number, value: string) => {
    setMarksRows((prev) => prev.map((row, i) => (i === index ? { ...row, remarks: value } : row)));
  };

  const canLoadStudents = sessionId && classId && sectionId && subjectId && assessmentTypeId;

  const sessionOptions = (sessions || []).map((s) => ({ value: s.id, label: s.name }));
  const classOptions = (classes || []).map((c) => ({ value: c.id, label: c.name }));
  const sectionOptions = (sections || []).map((s) => ({ value: s.id, label: s.name }));
  const subjectOptions = (subjects || []).map((s) => ({ value: s.id, label: `${s.name} (${s.code})` }));
  const assessmentTypeOptions = (assessmentTypes || [])
    .filter((at) => at.is_active)
    .map((at) => ({ value: at.id, label: `${at.name} (${at.code})` }));

  return (
    <div className="space-y-6">
      <PageHeader title="Marks Entry" description="Enter and manage student marks" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Step 1: Select Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Select
              label="Session"
              options={sessionOptions}
              value={sessionId}
              onChange={(e) => {
                setSessionId(e.target.value);
                resetSelections();
              }}
              placeholder="Select session"
            />
            <Select
              label="Class"
              options={classOptions}
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value);
                setSectionId('');
                setMarksRows([]);
                setStudentsLoaded(false);
              }}
              placeholder="Select class"
            />
            <Select
              label="Section"
              options={sectionOptions}
              value={sectionId}
              onChange={(e) => {
                setSectionId(e.target.value);
                setMarksRows([]);
                setStudentsLoaded(false);
              }}
              placeholder="Select section"
              disabled={!classId}
            />
            <Select
              label="Subject"
              options={subjectOptions}
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value);
                setMarksRows([]);
                setStudentsLoaded(false);
              }}
              placeholder="Select subject"
            />
            <Select
              label="Assessment Type"
              options={assessmentTypeOptions}
              value={assessmentTypeId}
              onChange={(e) => {
                setAssessmentTypeId(e.target.value);
                setMarksRows([]);
                setStudentsLoaded(false);
              }}
              placeholder="Select assessment type"
            />
            <div className="flex items-end">
              <Button
                onClick={handleLoadStudents}
                disabled={!canLoadStudents || loadingStudents}
                isLoading={loadingStudents}
                className="w-full"
              >
                Load Students
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {studentsLoaded && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">
                Step 2: Enter Marks ({marksRows.length} students)
              </CardTitle>
              <div className="flex items-center gap-3">
                {lastSaved && (
                  <span className="text-xs text-gray-500">
                    Last saved: {lastSaved.toLocaleTimeString()}
                  </span>
                )}
                {bulkUpsert.isPending && (
                  <span className="flex items-center gap-1 text-xs text-amber-600">
                    <Loader2 className="h-3 w-3 animate-spin" /> Saving...
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Step 3: Bulk Operations</span>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-500">Set all marks to:</label>
                  <input
                    type="number"
                    min={0}
                    max={marksRows[0]?.full_marks || 100}
                    defaultValue={0}
                    className="h-8 w-20 rounded-md border border-gray-300 px-2 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSetAll(parseInt((e.target as HTMLInputElement).value, 10) || 0);
                      }
                    }}
                    onBlur={(e) => {
                      handleSetAll(parseInt(e.target.value, 10) || 0);
                    }}
                  />
                  <Button variant="secondary" size="sm" onClick={() => handleSetAll(0)}>
                    <Hash className="h-3.5 w-3.5" /> Set
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleClearAll}>
                    <Eraser className="h-3.5 w-3.5" /> Clear All
                  </Button>
                </div>
              </div>

              {marksRows.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500">
                  No active students found for this selection.
                </p>
              ) : (
                <div className="max-h-[60vh] overflow-auto rounded-lg border border-gray-200">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">Roll No</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead className="w-28">Marks Obtained</TableHead>
                        <TableHead className="w-24">Full Marks</TableHead>
                        <TableHead>Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {marksRows.map((row, index) => (
                        <TableRow
                          key={row.enrollment_id}
                          className={validationErrors[index] ? 'bg-red-50' : undefined}
                        >
                          <TableCell className="font-medium">{row.roll_no || '-'}</TableCell>
                          <TableCell>{row.student_name}</TableCell>
                          <TableCell>
                            <input
                              type="number"
                              min={0}
                              max={row.full_marks}
                              value={row.marks_obtained || ''}
                              onChange={(e) => updateMarks(index, e.target.value)}
                              className={`h-9 w-full rounded-md border px-2 text-sm ${
                                validationErrors[index]
                                  ? 'border-red-500 focus:ring-red-500'
                                  : 'border-gray-300 focus:ring-amber-500'
                              } focus:outline-none focus:ring-2`}
                              placeholder="0"
                            />
                            {validationErrors[index] && (
                              <p className="mt-1 text-xs text-red-600">{validationErrors[index]}</p>
                            )}
                          </TableCell>
                          <TableCell className="text-center text-sm text-gray-600">
                            {row.full_marks}
                          </TableCell>
                          <TableCell>
                            <input
                              type="text"
                              value={row.remarks}
                              onChange={(e) => updateRemarks(index, e.target.value)}
                              className="h-9 w-full rounded-md border border-gray-300 px-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                              placeholder="Optional"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {marksRows.length > 0 && (
                <div className="mt-4 flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={handleSaveDraft}
                    disabled={bulkUpsert.isPending}
                    isLoading={bulkUpsert.isPending}
                  >
                    <Save className="h-4 w-4" /> Save Draft
                  </Button>
                  <Button
                    variant="success"
                    onClick={handleSubmitMarks}
                    disabled={bulkUpsert.isPending}
                    isLoading={bulkUpsert.isPending}
                  >
                    <Send className="h-4 w-4" /> Submit Marks
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
