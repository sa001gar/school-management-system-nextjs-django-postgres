'use client';

import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';

interface ClassFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; level: number }) => Promise<void>;
  isLoading?: boolean;
}

export function ClassForm({ isOpen, onClose, onSubmit, isLoading }: ClassFormProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<{ name: string; level: number }>();

  const handleFormSubmit = async (data: { name: string; level: number }) => {
    await onSubmit(data);
    reset();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Class" size="md">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
        <Input label="Class Name" placeholder="e.g. Class 1" error={errors.name?.message} {...register('name')} />
        <Input label="Level" type="number" error={errors.level?.message} {...register('level', { valueAsNumber: true })} />
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={isLoading}>Create Class</Button>
        </div>
      </form>
    </Modal>
  );
}
