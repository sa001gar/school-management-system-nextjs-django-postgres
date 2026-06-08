'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sessionCreateSchema, type SessionCreateFormData } from '@/lib/validators/session';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';

interface SessionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SessionCreateFormData) => Promise<void>;
  isLoading?: boolean;
}

export function SessionForm({ isOpen, onClose, onSubmit, isLoading }: SessionFormProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SessionCreateFormData>({
    resolver: zodResolver(sessionCreateSchema),
  });

  const handleFormSubmit = async (data: SessionCreateFormData) => {
    await onSubmit(data);
    reset();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Session" size="md">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
        <Input label="Session Name" placeholder="e.g. 2024-2025" error={errors.name?.message} {...register('name')} />
        <Input label="Start Date" type="date" error={errors.start_date?.message} {...register('start_date')} />
        <Input label="End Date" type="date" error={errors.end_date?.message} {...register('end_date')} />
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={isLoading}>Create Session</Button>
        </div>
      </form>
    </Modal>
  );
}
