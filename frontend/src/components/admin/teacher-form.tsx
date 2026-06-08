'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { teacherCreateSchema, type TeacherCreateFormData } from '@/lib/validators/teacher';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';

interface TeacherFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TeacherCreateFormData) => Promise<void>;
  isLoading?: boolean;
}

export function TeacherForm({ isOpen, onClose, onSubmit, isLoading }: TeacherFormProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<TeacherCreateFormData>({
    resolver: zodResolver(teacherCreateSchema),
  });

  const handleFormSubmit = async (data: TeacherCreateFormData) => {
    await onSubmit(data);
    reset();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Teacher" size="md">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
        <Input label="Full Name" placeholder="Teacher name" error={errors.name?.message} {...register('name')} />
        <Input label="Email" type="email" placeholder="teacher@school.com" error={errors.email?.message} {...register('email')} />
        <Input label="Password" type="password" placeholder="Min 6 characters" error={errors.password?.message} {...register('password')} />
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={isLoading}>Create Teacher</Button>
        </div>
      </form>
    </Modal>
  );
}
