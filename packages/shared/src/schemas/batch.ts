import { z } from "zod";

export const createBatchSchema = z.object({
  name: z.string().min(1).max(120),
  subject: z.string().min(1).max(80),
  grade: z.string().max(40).optional(),
  schedule: z.string().max(200).optional(),
  capacity: z.number().int().positive().optional(),
});
export type CreateBatchInput = z.infer<typeof createBatchSchema>;
