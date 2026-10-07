import type { FeeStatus } from "@tutionassist/shared";

/** period is "YYYY-MM"; returns "YYYY-MM-DD" using the plan's due day (1-28). */
export function dueDateForPeriod(period: string, dueDay: number): string {
  const day = String(dueDay).padStart(2, "0");
  return `${period}-${day}`;
}

/** Overdue is derived from the due date, never set manually. */
export function isOverdue(dueDate: string, status: FeeStatus, today: string): boolean {
  if (status === "paid" || status === "waived") return false;
  return dueDate < today;
}

export function effectiveStatus(dueDate: string, status: FeeStatus, today: string): FeeStatus {
  if ((status === "pending" || status === "partially_paid") && isOverdue(dueDate, status, today)) {
    return "overdue";
  }
  return status;
}

export function nextStatusAfterPayment(amountDue: number, totalPaid: number): FeeStatus {
  return totalPaid >= amountDue ? "paid" : "partially_paid";
}
