import { z } from 'zod';

export const marksEntrySchema = z.object({
  student_id: z.string().min(1, 'Student is required'),
  subject_id: z.string().min(1, 'Subject is required'),
  marks_obtained: z.number().min(0, 'Marks must be non-negative'),
  full_marks: z.number().min(1, 'Full marks must be at least 1'),
  is_absent: z.boolean().default(false),
  remarks: z.string().optional(),
});

export const bulkMarksSchema = z.object({
  marks: z.array(marksEntrySchema).min(1, 'At least one marks entry is required'),
});

export type MarksEntryFormData = z.infer<typeof marksEntrySchema>;
export type BulkMarksFormData = z.infer<typeof bulkMarksSchema>;
