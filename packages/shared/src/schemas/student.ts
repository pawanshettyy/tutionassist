import { z } from "zod";

export const createStudentSchema = z.object({
  name: z.string().min(1).max(120),
  grade: z.string().max(40).optional(),
  parentName: z.string().max(120).optional(),
  parentPhone: z.string().min(10).max(15).optional(),
});
export type CreateStudentInput = z.infer<typeof createStudentSchema>;

export const enrollStudentSchema = z.object({
  studentId: z.string().uuid(),
});
export type EnrollStudentInput = z.infer<typeof enrollStudentSchema>;
