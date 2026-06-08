import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const studentLoginSchema = z.object({
  student_id: z.string().min(1, 'Student ID is required'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type StudentLoginFormData = z.infer<typeof studentLoginSchema>;
