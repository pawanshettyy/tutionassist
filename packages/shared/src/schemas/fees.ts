import { z } from "zod";
import { FEE_FREQUENCIES, FEE_STATUSES, PAYMENT_MODES } from "../enums";

export const createFeePlanSchema = z.object({
  batchId: z.string().uuid(),
  amount: z.number().int().positive(), // whole rupees
  frequency: z.enum(FEE_FREQUENCIES),
  dueDay: z.number().int().min(1).max(28),
  lateFee: z.number().int().min(0).default(0),
});
export type CreateFeePlanInput = z.infer<typeof createFeePlanSchema>;

export const generateFeeRecordsSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, "Use YYYY-MM"),
});
export type GenerateFeeRecordsInput = z.infer<typeof generateFeeRecordsSchema>;

export const listFeesQuerySchema = z.object({
  status: z.enum(FEE_STATUSES).optional(),
  batchId: z.string().uuid().optional(),
});
export type ListFeesQuery = z.infer<typeof listFeesQuerySchema>;

export const recordPaymentSchema = z.object({
  amount: z.number().int().positive(),
  mode: z.enum(PAYMENT_MODES),
  utr: z.string().max(60).optional(),
});
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
