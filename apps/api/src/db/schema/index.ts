import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

const id = () => uuid("id").primaryKey().defaultRandom();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

// ---- Global tables (no row-level security) ----
export const tenants = pgTable("tenants", {
  id: id(),
  name: text("name").notNull(),
  upiVpa: text("upi_vpa"),
  createdAt: createdAt(),
});

export const users = pgTable("users", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  passwordHash: text("password_hash").notNull(),
  createdAt: createdAt(),
});

export const memberships = pgTable(
  "memberships",
  {
    id: id(),
    userId: uuid("user_id").notNull().references(() => users.id),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    role: text("role").notNull(),
    createdAt: createdAt(),
  },
  (t) => ({ uniq: unique().on(t.userId, t.tenantId, t.role) }),
);

// ---- Tenant-scoped tables (row-level security enabled in migrations) ----
export const students = pgTable("students", {
  id: id(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  name: text("name").notNull(),
  grade: text("grade"),
  parentName: text("parent_name"),
  parentPhone: text("parent_phone"),
  status: text("status").notNull().default("active"),
  createdAt: createdAt(),
});

export const parentStudentLinks = pgTable("parent_student_links", {
  id: id(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  parentUserId: uuid("parent_user_id").notNull().references(() => users.id),
  studentId: uuid("student_id").notNull().references(() => students.id),
  relation: text("relation"),
});

export const batches = pgTable("batches", {
  id: id(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  grade: text("grade"),
  schedule: text("schedule"),
  capacity: integer("capacity"),
  teacherUserId: uuid("teacher_user_id").references(() => users.id),
  createdAt: createdAt(),
});

export const enrollments = pgTable(
  "enrollments",
  {
    id: id(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    studentId: uuid("student_id").notNull().references(() => students.id),
    batchId: uuid("batch_id").notNull().references(() => batches.id),
    status: text("status").notNull().default("active"),
    startDate: date("start_date", { mode: "string" }).notNull().defaultNow(),
  },
  (t) => ({ uniq: unique().on(t.studentId, t.batchId) }),
);

export const attendanceSessions = pgTable(
  "attendance_sessions",
  {
    id: id(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    batchId: uuid("batch_id").notNull().references(() => batches.id),
    date: date("date", { mode: "string" }).notNull(),
    markedBy: uuid("marked_by").references(() => users.id),
    createdAt: createdAt(),
  },
  (t) => ({ uniq: unique().on(t.batchId, t.date) }),
);

export const attendanceRecords = pgTable(
  "attendance_records",
  {
    id: id(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    sessionId: uuid("session_id").notNull().references(() => attendanceSessions.id),
    studentId: uuid("student_id").notNull().references(() => students.id),
    status: text("status").notNull(),
  },
  (t) => ({ uniq: unique().on(t.sessionId, t.studentId) }),
);

export const feePlans = pgTable("fee_plans", {
  id: id(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  batchId: uuid("batch_id").notNull().references(() => batches.id),
  amount: integer("amount").notNull(),
  frequency: text("frequency").notNull(),
  dueDay: integer("due_day").notNull(),
  lateFee: integer("late_fee").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
});

export const feeRecords = pgTable(
  "fee_records",
  {
    id: id(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    studentId: uuid("student_id").notNull().references(() => students.id),
    planId: uuid("plan_id").notNull().references(() => feePlans.id),
    period: text("period").notNull(),
    amountDue: integer("amount_due").notNull(),
    amountPaid: integer("amount_paid").notNull().default(0),
    dueDate: date("due_date", { mode: "string" }).notNull(),
    status: text("status").notNull().default("pending"),
    createdAt: createdAt(),
  },
  (t) => ({ uniq: unique().on(t.studentId, t.planId, t.period) }),
);

export const payments = pgTable("payments", {
  id: id(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  feeRecordId: uuid("fee_record_id").notNull().references(() => feeRecords.id),
  amount: integer("amount").notNull(),
  mode: text("mode").notNull(),
  utr: text("utr"),
  confirmedBy: uuid("confirmed_by").references(() => users.id),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reminderLogs = pgTable("reminder_logs", {
  id: id(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  feeRecordId: uuid("fee_record_id").notNull().references(() => feeRecords.id),
  channel: text("channel").notNull(),
  sentBy: uuid("sent_by").references(() => users.id),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: id(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  actorId: uuid("actor_id").references(() => users.id),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: uuid("entity_id"),
  meta: jsonb("meta"),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
});
