export const ROLES = ["admin", "teacher", "student", "parent"] as const;
export type Role = (typeof ROLES)[number];

export const ATTENDANCE_STATUSES = ["present", "absent", "late", "excused"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const FEE_STATUSES = [
  "pending",
  "paid_pending_verification",
  "partially_paid",
  "paid",
  "overdue",
  "waived",
] as const;
export type FeeStatus = (typeof FEE_STATUSES)[number];

export const FEE_FREQUENCIES = ["monthly", "quarterly", "one_time"] as const;
export type FeeFrequency = (typeof FEE_FREQUENCIES)[number];

export const PAYMENT_MODES = ["cash", "upi", "bank", "razorpay"] as const;
export type PaymentMode = (typeof PAYMENT_MODES)[number];
