'use client';

import { useState } from 'react';
import { useSubjects, useCreateSubject, useDeleteSubject } from '@/hooks/use-subjects';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { Loading } from '@/components/ui/loading';
import { BookOpen, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export default function SubjectsPage() {
  const { data: subjects = [], isLoading } = useSubjects();
  const createSubject = useCreateSubject();
  const deleteSubject = useDeleteSubject();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{ name: string; code: string; full_marks: number }>();

  const onSubmit = async (data: { name: string; code: string; full_marks: number }) => {
    try {
      await createSubject.mutateAsync(data);
      toast.success('Subject created');
      setIsModalOpen(false);
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this subject?')) return;
    try {
      await deleteSubject.mutateAsync(id);
      toast.success('Subject deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subjects"
        description="Manage subjects"
        actions={<Button onClick={() => setIsModalOpen(true)}><Plus className="h-4 w-4" /> New Subject</Button>}
      />
      {subjects.length === 0 ? (
        <EmptyState icon={BookOpen} title="No subjects" description="Create your first subject" action={{ label: 'New Subject', onClick: () => setIsModalOpen(true) }} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Full Marks</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.code}</TableCell>
                  <TableCell>{s.full_marks}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(s.id)} className="text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Subject" size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <Input label="Subject Name" placeholder="e.g. Mathematics" error={errors.name?.message} {...register('name')} />
          <Input label="Code" placeholder="e.g. MATH" error={errors.code?.message} {...register('code')} />
          <Input label="Full Marks" type="number" error={errors.full_marks?.message} {...register('full_marks', { valueAsNumber: true })} />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={createSubject.isPending}>Create Subject</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
