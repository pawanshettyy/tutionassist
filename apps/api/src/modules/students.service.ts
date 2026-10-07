import type { CreateStudentInput } from "@tutionassist/shared";
import { and, desc, eq } from "drizzle-orm";
import { withTenant } from "../db/client";
import { batches, enrollments, students } from "../db/schema";
import { notFound } from "../lib/errors";

export const createStudent = (tenantId: string, input: CreateStudentInput) =>
  withTenant(tenantId, async (tx) => {
    const [row] = await tx.insert(students).values({ ...input, tenantId }).returning();
    return row!;
  });

export const listStudents = (tenantId: string) =>
  withTenant(tenantId, (tx) => tx.select().from(students).orderBy(desc(students.createdAt)));

export const enrollStudent = (tenantId: string, batchId: string, studentId: string) =>
  withTenant(tenantId, async (tx) => {
    const [batch] = await tx.select({ id: batches.id }).from(batches).where(eq(batches.id, batchId));
    if (!batch) throw notFound("Batch");
    const [student] = await tx.select({ id: students.id }).from(students).where(eq(students.id, studentId));
    if (!student) throw notFound("Student");
    await tx.insert(enrollments).values({ tenantId, batchId, studentId }).onConflictDoNothing();
    const [row] = await tx
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.batchId, batchId), eq(enrollments.studentId, studentId)));
    return row!;
  });

export const listBatchStudents = (tenantId: string, batchId: string) =>
  withTenant(tenantId, (tx) =>
    tx
      .select({ id: students.id, name: students.name, parentPhone: students.parentPhone })
      .from(enrollments)
      .innerJoin(students, eq(students.id, enrollments.studentId))
      .where(eq(enrollments.batchId, batchId)),
  );
