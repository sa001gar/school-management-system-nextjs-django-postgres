'use client';

import { useState } from 'react';
import { useSessions, useCreateSession, useDeleteSession, useLockSession } from '@/hooks/use-sessions';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { Loading } from '@/components/ui/loading';
import { Calendar, Plus, Trash2, Lock, Unlock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sessionCreateSchema, type SessionCreateFormData } from '@/lib/validators/session';
import { toast } from 'sonner';

export default function SessionsPage() {
  const { data: sessions = [], isLoading } = useSessions();
  const createSession = useCreateSession();
  const deleteSession = useDeleteSession();
  const lockSession = useLockSession();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SessionCreateFormData>({
    resolver: zodResolver(sessionCreateSchema),
  });

  const onSubmit = async (data: SessionCreateFormData) => {
    try {
      await createSession.mutateAsync(data);
      toast.success('Session created');
      setIsModalOpen(false);
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create session');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;
    try {
      await deleteSession.mutateAsync(id);
      toast.success('Session deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const handleLock = async (id: string) => {
    try {
      await lockSession.mutateAsync(id);
      toast.success('Session toggled');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sessions"
        description="Manage academic sessions"
        actions={
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4" /> New Session
          </Button>
        }
      />
      {sessions.length === 0 ? (
        <EmptyState icon={Calendar} title="No sessions" description="Create your first session to get started" action={{ label: 'New Session', onClick: () => setIsModalOpen(true) }} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.start_date}</TableCell>
                  <TableCell>{s.end_date}</TableCell>
                  <TableCell>
                    <Badge variant={s.is_active ? 'success' : 'secondary'}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    {s.is_locked && <Badge variant="warning" className="ml-1">Locked</Badge>}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => handleLock(s.id)} title={s.is_locked ? 'Unlock' : 'Lock'}>
                        {s.is_locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Session" size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <Input label="Session Name" placeholder="e.g. 2024-2025" error={errors.name?.message} {...register('name')} />
          <Input label="Start Date" type="date" error={errors.start_date?.message} {...register('start_date')} />
          <Input label="End Date" type="date" error={errors.end_date?.message} {...register('end_date')} />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={createSession.isPending}>Create Session</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
