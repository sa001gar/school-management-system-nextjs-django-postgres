'use client';

import { useState, useEffect } from 'react';
import {
  useEnrollments,
  usePromoteEnrollment,
  useRetainEnrollment,
  useTransferEnrollment,
} from '@/hooks/use-enrollments';
import { useSessions, useActiveSession } from '@/hooks/use-sessions';
import { useClasses, useSections } from '@/hooks/use-classes';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Loading } from '@/components/ui/loading';
import { GraduationCap, ArrowUp, RotateCcw, LogOut, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';
import type { Enrollment, EnrollmentStatus } from '@/types';

const statusBadge: Record<EnrollmentStatus, { label: string; variant: 'success' | 'info' | 'warning' | 'danger' | 'secondary' }> = {
  active: { label: 'Active', variant: 'success' },
  promoted: { label: 'Promoted', variant: 'info' },
  retained: { label: 'Retained', variant: 'warning' },
  transferred: { label: 'Transferred', variant: 'danger' },
  graduated: { label: 'Graduated', variant: 'secondary' },
  dropped: { label: 'Dropped', variant: 'secondary' },
  withdrawn: { label: 'Withdrawn', variant: 'danger' },
};

export default function EnrollmentsPage() {
  const { data: sessions = [] } = useSessions();
  const { data: activeSession } = useActiveSession();
  const { data: classes = [] } = useClasses();

  const [sessionId, setSessionId] = useState('');
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');

  const { data: sections = [] } = useSections(classId);

  useEffect(() => {
    if (activeSession && !sessionId) setSessionId(activeSession.id);
  }, [activeSession, sessionId]);

  const filters: Record<string, unknown> = {};
  if (sessionId) filters.session_id = sessionId;
  if (classId) filters.class_id = classId;
  if (sectionId) filters.section_id = sectionId;

  const { data: enrollmentsData, isLoading } = useEnrollments(filters);
  const enrollments = enrollmentsData?.results || [];

  const promote = usePromoteEnrollment();
  const retain = useRetainEnrollment();
  const transfer = useTransferEnrollment();

  const [promoteModal, setPromoteModal] = useState<Enrollment | null>(null);
  const [retainModal, setRetainModal] = useState<Enrollment | null>(null);
  const [transferModal, setTransferModal] = useState<Enrollment | null>(null);
  const [bulkModal, setBulkModal] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [promoteForm, setPromoteForm] = useState({ new_class: '', new_section: '', new_roll_no: '', remarks: '' });
  const [retainForm, setRetainForm] = useState({ new_roll_no: '', remarks: '' });
  const [transferForm, setTransferForm] = useState({ remarks: '' });
  const [bulkForm, setBulkForm] = useState({ new_class: '', new_section: '', new_roll_no: '' });

  const { data: promoteSections = [] } = useSections(promoteForm.new_class);
  const { data: bulkSections = [] } = useSections(bulkForm.new_class);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === enrollments.length) setSelected(new Set());
    else setSelected(new Set(enrollments.map((e) => e.id)));
  };

  const resetPromoteForm = () => setPromoteForm({ new_class: '', new_section: '', new_roll_no: '', remarks: '' });
  const resetRetainForm = () => setRetainForm({ new_roll_no: '', remarks: '' });
  const resetTransferForm = () => setTransferForm({ remarks: '' });
  const resetBulkForm = () => setBulkForm({ new_class: '', new_section: '', new_roll_no: '' });

  const handlePromote = async () => {
    if (!promoteModal) return;
    try {
      await promote.mutateAsync({
        id: promoteModal.id,
        data: {
          new_class: promoteForm.new_class || undefined,
          new_section: promoteForm.new_section || undefined,
          remarks: promoteForm.remarks || undefined,
        },
      });
      toast.success('Student promoted');
      setPromoteModal(null);
      resetPromoteForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleRetain = async () => {
    if (!retainModal) return;
    try {
      await retain.mutateAsync({
        id: retainModal.id,
        data: { remarks: retainForm.remarks || undefined },
      });
      toast.success('Student retained');
      setRetainModal(null);
      resetRetainForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleTransfer = async () => {
    if (!transferModal) return;
    try {
      await transfer.mutateAsync({
        id: transferModal.id,
        data: { remarks: transferForm.remarks },
      });
      toast.success('Student transferred out');
      setTransferModal(null);
      resetTransferForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleBulkPromote = async () => {
    if (selected.size === 0 || !sessionId) return;
    try {
      const api = (await import('@/lib/api/enrollments')).enrollmentsApi;
      await api.bulkEnroll({
        student_ids: Array.from(selected),
        session_id: sessionId,
        class_id: bulkForm.new_class,
        section_id: bulkForm.new_section,
      });
      toast.success(`${selected.size} students promoted`);
      setSelected(new Set());
      setBulkModal(false);
      resetBulkForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enrollments"
        description="Manage student enrollments and promotions"
        actions={
          selected.size > 0 ? (
            <Button onClick={() => setBulkModal(true)}>
              <CheckSquare className="h-4 w-4" /> Bulk Promote ({selected.size})
            </Button>
          ) : undefined
        }
      />

      <div className="flex gap-4 flex-wrap">
        <Select
          placeholder="Select Session"
          options={sessions.map((s) => ({ value: s.id, label: s.name }))}
          value={sessionId}
          onChange={(e) => { setSessionId(e.target.value); setClassId(''); setSectionId(''); }}
        />
        <Select
          placeholder="All Classes"
          options={classes.map((c) => ({ value: c.id, label: c.name }))}
          value={classId}
          onChange={(e) => { setClassId(e.target.value); setSectionId(''); }}
        />
        <Select
          placeholder="All Sections"
          options={sections.map((s) => ({ value: s.id, label: s.name }))}
          value={sectionId}
          onChange={(e) => setSectionId(e.target.value)}
        />
      </div>

      {enrollments.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No enrollments"
          description="No enrollments found for the selected filters"
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selected.size === enrollments.length && enrollments.length > 0}
                    onChange={toggleAll}
                    className="rounded border-gray-300"
                  />
                </TableHead>
                <TableHead>Roll No</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Student ID</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.map((e) => {
                const badge = statusBadge[e.status] || statusBadge.active;
                return (
                  <TableRow key={e.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selected.has(e.id)}
                        onChange={() => toggleSelect(e.id)}
                        className="rounded border-gray-300"
                      />
                    </TableCell>
                    <TableCell>{e.roll_no}</TableCell>
                    <TableCell className="font-medium">{e.student_name}</TableCell>
                    <TableCell>{e.student_id}</TableCell>
                    <TableCell>{e.class_name}</TableCell>
                    <TableCell>{e.section_name}</TableCell>
                    <TableCell>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => { resetPromoteForm(); setPromoteModal(e); }} title="Promote">
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => { resetRetainForm(); setRetainModal(e); }} title="Retain">
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => { resetTransferForm(); setTransferModal(e); }} title="Transfer">
                          <LogOut className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Modal isOpen={!!promoteModal} onClose={() => setPromoteModal(null)} title="Promote Student" size="md">
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-500">
            Promoting <span className="font-medium text-gray-900">{promoteModal?.student_name}</span> from{' '}
            <span className="font-medium">{promoteModal?.class_name} - {promoteModal?.section_name}</span>
          </p>
          <Select
            label="Target Class"
            placeholder="Select class"
            options={classes.map((c) => ({ value: c.id, label: c.name }))}
            value={promoteForm.new_class}
            onChange={(e) => setPromoteForm((f) => ({ ...f, new_class: e.target.value, new_section: '' }))}
          />
          <Select
            label="Target Section"
            placeholder="Select section"
            options={promoteSections.map((s) => ({ value: s.id, label: s.name }))}
            value={promoteForm.new_section}
            onChange={(e) => setPromoteForm((f) => ({ ...f, new_section: e.target.value }))}
          />
          <Input
            label="New Roll No"
            placeholder="Optional"
            value={promoteForm.new_roll_no}
            onChange={(e) => setPromoteForm((f) => ({ ...f, new_roll_no: e.target.value }))}
          />
          <Input
            label="Remarks"
            placeholder="Optional"
            value={promoteForm.remarks}
            onChange={(e) => setPromoteForm((f) => ({ ...f, remarks: e.target.value }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setPromoteModal(null)}>Cancel</Button>
            <Button onClick={handlePromote} isLoading={promote.isPending}>Confirm Promotion</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!retainModal} onClose={() => setRetainModal(null)} title="Retain Student" size="md">
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-500">
            Retaining <span className="font-medium text-gray-900">{retainModal?.student_name}</span> in{' '}
            <span className="font-medium">{retainModal?.class_name} - {retainModal?.section_name}</span>
          </p>
          <Input
            label="New Roll No"
            placeholder="Optional"
            value={retainForm.new_roll_no}
            onChange={(e) => setRetainForm((f) => ({ ...f, new_roll_no: e.target.value }))}
          />
          <Input
            label="Remarks"
            placeholder="Optional"
            value={retainForm.remarks}
            onChange={(e) => setRetainForm((f) => ({ ...f, remarks: e.target.value }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setRetainModal(null)}>Cancel</Button>
            <Button onClick={handleRetain} isLoading={retain.isPending}>Confirm Retention</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!transferModal} onClose={() => setTransferModal(null)} title="Transfer Out Student" size="md">
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-500">
            Transferring out <span className="font-medium text-gray-900">{transferModal?.student_name}</span> from{' '}
            <span className="font-medium">{transferModal?.class_name} - {transferModal?.section_name}</span>
          </p>
          <Input
            label="Remarks"
            placeholder="Transfer reason (required)"
            value={transferForm.remarks}
            onChange={(e) => setTransferForm((f) => ({ ...f, remarks: e.target.value }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setTransferModal(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleTransfer}
              isLoading={transfer.isPending}
              disabled={!transferForm.remarks.trim()}
            >
              Confirm Transfer
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={bulkModal} onClose={() => setBulkModal(false)} title="Bulk Promote Students" size="md">
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-500">
            Promoting <span className="font-medium text-gray-900">{selected.size}</span> selected students
          </p>
          <Select
            label="Target Class"
            placeholder="Select class"
            options={classes.map((c) => ({ value: c.id, label: c.name }))}
            value={bulkForm.new_class}
            onChange={(e) => setBulkForm((f) => ({ ...f, new_class: e.target.value, new_section: '' }))}
          />
          <Select
            label="Target Section"
            placeholder="Select section"
            options={bulkSections.map((s) => ({ value: s.id, label: s.name }))}
            value={bulkForm.new_section}
            onChange={(e) => setBulkForm((f) => ({ ...f, new_section: e.target.value }))}
          />
          <Input
            label="New Roll No"
            placeholder="Optional"
            value={bulkForm.new_roll_no}
            onChange={(e) => setBulkForm((f) => ({ ...f, new_roll_no: e.target.value }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setBulkModal(false)}>Cancel</Button>
            <Button onClick={handleBulkPromote} disabled={!bulkForm.new_class || !bulkForm.new_section}>
              Promote {selected.size} Students
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
