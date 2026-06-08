'use client';

import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';

interface SubjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; code: string; full_marks: number }) => Promise<void>;
  isLoading?: boolean;
}

export function SubjectForm({ isOpen, onClose, onSubmit, isLoading }: SubjectFormProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<{ name: string; code: string; full_marks: number }>();

  const handleFormSubmit = async (data: { name: string; code: string; full_marks: number }) => {
    await onSubmit(data);
    reset();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Subject" size="md">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
        <Input label="Subject Name" placeholder="e.g. Mathematics" error={errors.name?.message} {...register('name')} />
        <Input label="Code" placeholder="e.g. MATH" error={errors.code?.message} {...register('code')} />
        <Input label="Full Marks" type="number" error={errors.full_marks?.message} {...register('full_marks', { valueAsNumber: true })} />
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={isLoading}>Create Subject</Button>
        </div>
      </form>
    </Modal>
  );
}
