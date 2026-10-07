# Architecture

```
Web (Next.js) ─┐
Mobile (Expo) ─┴─▶ REST /api/v1 (Fastify) ─▶ PostgreSQL (RLS per tenant)
                         │
                         └─▶ Redis + BullMQ workers (reminders, receipts)  [phase 2]
```

## Request flow
1. Client sends `Authorization: Bearer <jwt>`; token carries `sub`, `tenantId`, `role`.
2. `requireRole(...)` checks the role.
3. Services call `withTenant(tenantId, tx => ...)`, which sets `app.tenant_id` for the transaction.
4. Postgres RLS policies filter every tenant-scoped table by that setting.

## Modules (apps/api/src/modules)
`<name>.routes.ts` (HTTP + validation) and `<name>.service.ts` (rules + queries). Split a
`<name>.repository.ts` out of a service once its queries grow.

## Fee flow
`fee_plans` → `generateRecords(period)` → `fee_records` (pending). Overdue is derived from
`due_date`. Reminder = WhatsApp click-to-chat link + UPI QR. Teacher records the payment, which
updates `amount_paid`, status, and writes an audit log row.

## Not built yet
Homework, tests/marks, parent portal data endpoints, announcements, notifications, receipts,
Razorpay, OTP login, invites, background jobs, mobile app.
