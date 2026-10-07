import type {
  CreateFeePlanInput,
  FeeStatus,
  ListFeesQuery,
  RecordPaymentInput,
} from "@tutionassist/shared";
import {
  DEFAULT_FEE_REMINDER_TEMPLATE,
  buildUpiUri,
  buildWaLink,
  dueDateForPeriod,
  effectiveStatus,
  nextStatusAfterPayment,
  renderTemplate,
} from "@tutionassist/utils";
import { and, eq, sql } from "drizzle-orm";
import { db, withTenant } from "../db/client";
import {
  auditLogs,
  enrollments,
  feePlans,
  feeRecords,
  payments,
  reminderLogs,
  students,
  tenants,
} from "../db/schema";
import { AppError, badRequest, notFound } from "../lib/errors";

const today = () => new Date().toISOString().slice(0, 10);

export const createPlan = (tenantId: string, input: CreateFeePlanInput) =>
  withTenant(tenantId, async (tx) => {
    const [row] = await tx.insert(feePlans).values({ ...input, tenantId }).returning();
    return row!;
  });

/** Creates one fee record per enrolled student for the period. Safe to call twice. */
export const generateRecords = (tenantId: string, planId: string, period: string) =>
  withTenant(tenantId, async (tx) => {
    const [plan] = await tx.select().from(feePlans).where(eq(feePlans.id, planId));
    if (!plan) throw notFound("Fee plan");
    const enrolled = await tx
      .select({ studentId: enrollments.studentId })
      .from(enrollments)
      .where(eq(enrollments.batchId, plan.batchId));
    if (enrolled.length === 0) return { created: 0 };
    const inserted = await tx
      .insert(feeRecords)
      .values(
        enrolled.map((e) => ({
          tenantId,
          studentId: e.studentId,
          planId,
          period,
          amountDue: plan.amount,
          dueDate: dueDateForPeriod(period, plan.dueDay),
        })),
      )
      .onConflictDoNothing()
      .returning({ id: feeRecords.id });
    return { created: inserted.length };
  });

export const listFees = (tenantId: string, query: ListFeesQuery) =>
  withTenant(tenantId, async (tx) => {
    const rows = await tx
      .select({
        id: feeRecords.id,
        studentId: students.id,
        studentName: students.name,
        parentPhone: students.parentPhone,
        period: feeRecords.period,
        amountDue: feeRecords.amountDue,
        amountPaid: feeRecords.amountPaid,
        dueDate: feeRecords.dueDate,
        status: feeRecords.status,
        batchId: feePlans.batchId,
      })
      .from(feeRecords)
      .innerJoin(students, eq(students.id, feeRecords.studentId))
      .innerJoin(feePlans, eq(feePlans.id, feeRecords.planId))
      .where(query.batchId ? eq(feePlans.batchId, query.batchId) : sql`true`);

    const now = today();
    const items = rows.map((r) => ({
      ...r,
      status: effectiveStatus(r.dueDate, r.status as FeeStatus, now),
    }));
    return query.status ? items.filter((i) => i.status === query.status) : items;
  });

/** Builds the WhatsApp click-to-chat link + UPI link and logs that a reminder was prepared. */
export const prepareReminder = (tenantId: string, userId: string, feeRecordId: string) =>
  withTenant(tenantId, async (tx) => {
    const [row] = await tx
      .select({
        fee: feeRecords,
        student: students,
        batchId: feePlans.batchId,
      })
      .from(feeRecords)
      .innerJoin(students, eq(students.id, feeRecords.studentId))
      .innerJoin(feePlans, eq(feePlans.id, feeRecords.planId))
      .where(eq(feeRecords.id, feeRecordId));
    if (!row) throw notFound("Fee record");
    if (!row.student.parentPhone) throw badRequest("Student has no parent phone number");

    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId));
    if (!tenant?.upiVpa) throw badRequest("Add your UPI ID in settings before sending reminders");

    const balance = row.fee.amountDue - row.fee.amountPaid;
    const upiUri = buildUpiUri({
      payeeVpa: tenant.upiVpa,
      payeeName: tenant.name,
      amount: balance,
      note: `FEE-${row.fee.id.slice(0, 8)}`,
    });
    const message = renderTemplate(DEFAULT_FEE_REMINDER_TEMPLATE, {
      parent: row.student.parentName ?? "Parent",
      class_name: tenant.name,
      amount: balance,
      student: row.student.name,
      period: row.fee.period,
      due_date: row.fee.dueDate,
      upi_id: tenant.upiVpa,
    });
    await tx.insert(reminderLogs).values({ tenantId, feeRecordId, channel: "whatsapp_link", sentBy: userId });
    return { waLink: buildWaLink(row.student.parentPhone, message), upiUri, message };
  });

export const recordPayment = (
  tenantId: string,
  userId: string,
  feeRecordId: string,
  input: RecordPaymentInput,
) =>
  withTenant(tenantId, async (tx) => {
    const [fee] = await tx.select().from(feeRecords).where(eq(feeRecords.id, feeRecordId));
    if (!fee) throw notFound("Fee record");
    if (fee.status === "paid" || fee.status === "waived") {
      throw new AppError(409, "ALREADY_SETTLED", "This fee is already settled");
    }
    const totalPaid = fee.amountPaid + input.amount;
    const status = nextStatusAfterPayment(fee.amountDue, totalPaid);

    await tx.insert(payments).values({
      tenantId,
      feeRecordId,
      amount: input.amount,
      mode: input.mode,
      utr: input.utr,
      confirmedBy: userId,
    });
    await tx
      .update(feeRecords)
      .set({ amountPaid: totalPaid, status })
      .where(and(eq(feeRecords.id, feeRecordId)));
    await tx.insert(auditLogs).values({
      tenantId,
      actorId: userId,
      action: "fee.payment_recorded",
      entity: "fee_record",
      entityId: feeRecordId,
      meta: { amount: input.amount, mode: input.mode, status },
    });
    return { feeRecordId, amountPaid: totalPaid, status };
  });
