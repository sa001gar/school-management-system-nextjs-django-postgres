'use client';

import { useState } from 'react';
import { useTeachers, useCreateTeacher, useDeleteTeacher } from '@/hooks/use-teachers';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { Loading } from '@/components/ui/loading';
import { UserCheck, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { teacherCreateSchema, type TeacherCreateFormData } from '@/lib/validators/teacher';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

export default function TeachersPage() {
  const { data: teachers = [], isLoading } = useTeachers();
  const createTeacher = useCreateTeacher();
  const deleteTeacher = useDeleteTeacher();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TeacherCreateFormData>({
    resolver: zodResolver(teacherCreateSchema),
  });

  const onSubmit = async (data: TeacherCreateFormData) => {
    try {
      await createTeacher.mutateAsync(data);
      toast.success('Teacher created');
      setIsModalOpen(false);
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this teacher?')) return;
    try {
      await deleteTeacher.mutateAsync(id);
      toast.success('Teacher deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teachers"
        description="Manage teacher accounts"
        actions={<Button onClick={() => setIsModalOpen(true)}><Plus className="h-4 w-4" /> New Teacher</Button>}
      />
      {teachers.length === 0 ? (
        <EmptyState icon={UserCheck} title="No teachers" description="Add your first teacher" action={{ label: 'New Teacher', onClick: () => setIsModalOpen(true) }} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{t.email}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(t.id)} className="text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Teacher" size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <Input label="Full Name" placeholder="Teacher name" error={errors.name?.message} {...register('name')} />
          <Input label="Email" type="email" placeholder="teacher@school.com" error={errors.email?.message} {...register('email')} />
          <Input label="Password" type="password" placeholder="Min 6 characters" error={errors.password?.message} {...register('password')} />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={createTeacher.isPending}>Create Teacher</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
