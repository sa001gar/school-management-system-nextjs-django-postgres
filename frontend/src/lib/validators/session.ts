import { z } from 'zod';

export const sessionCreateSchema = z.object({
  name: z.string().min(1, 'Session name is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
});

export type SessionCreateFormData = z.infer<typeof sessionCreateSchema>;
