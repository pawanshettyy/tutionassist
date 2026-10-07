import { z } from "zod";
import { ATTENDANCE_STATUSES } from "../enums";

export const markAttendanceSchema = z.object({
  batchId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  records: z
    .array(z.object({ studentId: z.string().uuid(), status: z.enum(ATTENDANCE_STATUSES) }))
    .min(1),
});
export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
