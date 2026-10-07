import type { AttendanceStatus, MarkAttendanceInput } from "@tutionassist/shared";
import { attendancePercentage } from "@tutionassist/utils";
import { and, eq } from "drizzle-orm";
import { withTenant } from "../db/client";
import { attendanceRecords, attendanceSessions, batches, enrollments, students } from "../db/schema";
import { notFound } from "../lib/errors";

export const markAttendance = (tenantId: string, userId: string, input: MarkAttendanceInput) =>
  withTenant(tenantId, async (tx) => {
    const [batch] = await tx.select({ id: batches.id }).from(batches).where(eq(batches.id, input.batchId));
    if (!batch) throw notFound("Batch");

    await tx
      .insert(attendanceSessions)
      .values({ tenantId, batchId: input.batchId, date: input.date, markedBy: userId })
      .onConflictDoNothing();
    const [session] = await tx
      .select()
      .from(attendanceSessions)
      .where(and(eq(attendanceSessions.batchId, input.batchId), eq(attendanceSessions.date, input.date)));

    for (const r of input.records) {
      await tx
        .insert(attendanceRecords)
        .values({ tenantId, sessionId: session!.id, studentId: r.studentId, status: r.status })
        .onConflictDoUpdate({
          target: [attendanceRecords.sessionId, attendanceRecords.studentId],
          set: { status: r.status },
        });
    }
    return { sessionId: session!.id, date: input.date, marked: input.records.length };
  });

export const batchSummary = (tenantId: string, batchId: string) =>
  withTenant(tenantId, async (tx) => {
    const rows = await tx
      .select({
        studentId: students.id,
        name: students.name,
        status: attendanceRecords.status,
      })
      .from(enrollments)
      .innerJoin(students, eq(students.id, enrollments.studentId))
      .leftJoin(
        attendanceSessions,
        and(eq(attendanceSessions.batchId, enrollments.batchId)),
      )
      .leftJoin(
        attendanceRecords,
        and(
          eq(attendanceRecords.sessionId, attendanceSessions.id),
          eq(attendanceRecords.studentId, students.id),
        ),
      )
      .where(eq(enrollments.batchId, batchId));

    const byStudent = new Map<string, { name: string; statuses: AttendanceStatus[] }>();
    for (const r of rows) {
      const entry = byStudent.get(r.studentId) ?? { name: r.name, statuses: [] };
      if (r.status) entry.statuses.push(r.status as AttendanceStatus);
      byStudent.set(r.studentId, entry);
    }
    return [...byStudent.entries()].map(([studentId, v]) => ({
      studentId,
      name: v.name,
      sessions: v.statuses.length,
      percentage: attendancePercentage(v.statuses),
    }));
  });
