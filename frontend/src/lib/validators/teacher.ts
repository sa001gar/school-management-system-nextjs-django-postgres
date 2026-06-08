import { z } from 'zod';

export const teacherCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type TeacherCreateFormData = z.infer<typeof teacherCreateSchema>;
