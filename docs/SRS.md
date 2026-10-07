# Software Requirements Specification
## Tuition Classes Management Platform (working title)

| | |
|---|---|
| **Version** | 0.1 (draft) |
| **Date** | 5 October 2026 |
| **Author** | Pawan |
| **Status** | Living document, update as decisions are made |

---

## 1. Introduction

### 1.1 Purpose
This document defines the requirements for a multi-tenant platform that lets small, medium and large tuition classes manage attendance, fee collection and reminders, homework, test marks, and parent monitoring. It is the reference to build against: every feature, API and screen should trace back to a requirement ID here.

### 1.2 Scope
The product is delivered in two stages: a **web application** first, then a **mobile application** consuming the same backend API. It targets tuition classes that currently have no app of their own and run on WhatsApp groups, paper registers and manual UPI tracking.

**In scope:** tenancy and roles, batch/student management, attendance, fees and reminders, homework, tests and marks, parent portal, notifications, basic analytics.

**Out of scope (v1):** live video classes, full LMS/course content hosting, payroll for teachers, school-grade ERP features (timetable engine, transport, library), multi-language content authoring.

### 1.3 Definitions

| Term | Meaning |
|---|---|
| Tenant | One tuition class business (may have multiple branches) |
| Branch | A physical centre of a tenant |
| Batch | A group of students taught together (e.g., "Class 10 Maths, 5 PM") |
| Fee plan | Pricing and schedule attached to a batch (monthly, quarterly, installments) |
| UTR | UPI transaction reference number |
| RBAC | Role-based access control |

### 1.3 Intended audience
Developer (primary), potential collaborators, and early pilot tuition teachers who will validate requirements.

---

## 2. Overall Description

### 2.1 Product perspective
A standalone SaaS product. One deployment serves many tenants, with strict data isolation. The web app and future mobile app are clients of a single REST API.

### 2.2 User classes

| Role | Description | Key needs |
|---|---|---|
| **Owner/Admin** | Runs the class; may have several branches | Setup, fees overview, reports, staff control |
| **Teacher** | Teaches one or more batches | Mark attendance, post homework, enter marks, send fee reminders |
| **Student** | Attends batches | See schedule, submit homework, view marks |
| **Parent** | Guardian of one or more students | Monitor attendance, fees, homework, marks; pay fees |

A single person may hold more than one role (e.g., owner who also teaches). A parent may be linked to multiple children, possibly across tenants.

### 2.3 Operating environment
- Web: modern evergreen browsers, responsive down to 360 px width (most parents will use phones)
- Mobile (phase 3): Android first, iOS after
- Backend: Linux containers, PostgreSQL, Redis

### 2.4 Assumptions and dependencies
- Parents have WhatsApp and UPI.
- Teachers have a smartphone and may have little technical comfort, so the UI must stay simple.
- Dependencies: WhatsApp (click-to-chat in MVP, Business Cloud API later), Razorpay (optional payment path), SMS/email provider, object storage for files.

### 2.5 Constraints
- Indian context: INR currency, UPI as the primary payment method, English with Hindi and Marathi UI later.
- Personal data of minors is stored, so privacy and access control are first-class concerns (see NFR-SEC).
- Solo developer: scope must be phased and the MVP kept thin.

---

## 3. Functional Requirements

Priority: **M** = must, **S** = should, **C** = could. Phase: **P1** = MVP, **P2**, **P3**.

### 3.1 Authentication, tenancy and roles

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-AUTH-01 | Users sign in with phone number + OTP or email + password. | M | P1 |
| FR-AUTH-02 | An Owner can register a new tenant and becomes its first admin. | M | P1 |
| FR-AUTH-03 | Admin can invite teachers, students and parents via link or phone number. | M | P1 |
| FR-AUTH-04 | All data is scoped to a tenant; no user can read or write another tenant's data. | M | P1 |
| FR-AUTH-05 | Permissions are enforced server-side per role (see matrix in 3.10). | M | P1 |
| FR-AUTH-06 | A user holding multiple roles or linked to multiple tenants can switch context. | S | P2 |
| FR-AUTH-07 | Session management: refresh tokens, logout on all devices. | S | P2 |

### 3.2 Organisation setup

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-ORG-01 | Admin can create and edit branches. | M | P1 |
| FR-ORG-02 | Admin can create batches with name, subject, grade, schedule (days/time), teacher(s) and capacity. | M | P1 |
| FR-ORG-03 | Admin can add students individually or via CSV import and assign them to batches. | M | P1 |
| FR-ORG-04 | Each student can be linked to one or more parent accounts. | M | P1 |
| FR-ORG-05 | A student can belong to multiple batches. | M | P1 |
| FR-ORG-06 | Students can be deactivated or archived without deleting history. | S | P2 |

### 3.3 Attendance

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-ATT-01 | Teacher can open a batch session for a date and mark each student Present, Absent, Late or Excused. | M | P1 |
| FR-ATT-02 | Marking defaults to "Present" with quick toggle for absentees (optimised for speed). | M | P1 |
| FR-ATT-03 | Attendance can be edited within a configurable window (default 24 h) with an audit entry. | S | P1 |
| FR-ATT-04 | Parent is notified when their child is marked Absent. | M | P2 |
| FR-ATT-05 | Attendance percentage is computed per student and per batch for any date range. | M | P1 |
| FR-ATT-06 | Teacher can mark a holiday or cancelled class for a batch. | S | P2 |
| FR-ATT-07 | Attendance export (CSV/PDF) per batch and month. | C | P3 |

### 3.4 Fees and payments

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-FEE-01 | Admin defines a fee plan per batch: amount, frequency (monthly/quarterly/one-time/installments), due day, optional late fee, optional discount per student. | M | P1 |
| FR-FEE-02 | The system auto-generates fee records (dues) per student per period from the plan. | M | P1 |
| FR-FEE-03 | Each fee record has a status: `pending`, `paid_pending_verification`, `paid`, `overdue`, `waived`, `partially_paid`. | M | P1 |
| FR-FEE-04 | Teacher/Admin sees a list of pending and overdue fees, filterable by batch, branch, month and status. | M | P1 |
| FR-FEE-05 | **WhatsApp reminder:** teacher can send a fee reminder to a parent via WhatsApp click-to-chat with a prefilled message containing the student name, amount, due date and payment QR/link. | M | P1 |
| FR-FEE-06 | **Bulk reminders:** a "Remind all pending" screen lists parents with one-tap send links in sequence. | M | P1 |
| FR-FEE-07 | The system generates a **UPI QR** per fee record (`upi://pay` URI with payee VPA, amount, and note referencing the fee ID) and displays/embeds it in the reminder. | M | P1 |
| FR-FEE-08 | Teacher can manually mark a fee as paid (cash, UPI, bank) with mode, date, optional UTR/screenshot. | M | P1 |
| FR-FEE-09 | Parent can report "I have paid" with UTR/screenshot, moving the fee to `paid_pending_verification` for teacher confirmation. | S | P1 |
| FR-FEE-10 | Teacher can edit reminder message templates, with variables like `{student}`, `{amount}`, `{due_date}`, `{class_name}`. | S | P2 |
| FR-FEE-11 | Optional **Razorpay** integration: payment links/QR with webhook-based automatic confirmation and reconciliation. | S | P2 |
| FR-FEE-12 | Automated reminder schedule (e.g., 3 days before due, on due date, every N days overdue) via WhatsApp Business API/SMS. | S | P2 |
| FR-FEE-13 | A receipt (PDF and shareable link) is generated for every confirmed payment. | M | P2 |
| FR-FEE-14 | Support partial payments and installments tracked against one fee record. | S | P2 |
| FR-FEE-15 | Every reminder sent and every status change is logged (who, when, channel). | M | P1 |
| FR-FEE-16 | Fee summary dashboard: collected, pending, overdue by period. | M | P1 |

### 3.5 Homework

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-HW-01 | Teacher creates homework for one or more batches with title, description, attachments, due date. | M | P2 |
| FR-HW-02 | Student can submit text and/or file/photo uploads before or after the due date (late flagged). | M | P2 |
| FR-HW-03 | Teacher can view submissions per assignment, mark as reviewed, grade, and leave feedback. | M | P2 |
| FR-HW-04 | Students and parents see pending, submitted, graded and overdue homework. | M | P2 |
| FR-HW-05 | Allowed file types: images, PDF, docx; max size configurable (default 10 MB). | M | P2 |
| FR-HW-06 | Notification on new homework and on approaching due date. | S | P2 |

### 3.6 Tests and marks

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-TEST-01 | Teacher creates a test for a batch with name, date, subject, max marks. | M | P2 |
| FR-TEST-02 | Teacher enters marks per student (grid entry, or CSV upload); absent students flagged. | M | P2 |
| FR-TEST-03 | Optional upload of question paper and answer sheet images/PDF per test or student. | C | P3 |
| FR-TEST-04 | Student/parent see marks, percentage, batch average and rank (rank configurable/hideable by admin). | M | P2 |
| FR-TEST-05 | Performance trend chart per student across tests and subjects. | S | P3 |
| FR-TEST-06 | Notification to parent when marks are published. | S | P2 |

### 3.7 Parent portal

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-PAR-01 | Parent sees a dashboard per linked child: attendance %, upcoming fees, pending homework, latest marks. | M | P1 (attendance, fees) / P2 (rest) |
| FR-PAR-02 | Parent can switch between children. | M | P1 |
| FR-PAR-03 | Parent can view fee history and download receipts. | M | P2 |
| FR-PAR-04 | Parent can view announcements from the class. | M | P2 |
| FR-PAR-05 | Parent can message or raise a query to the teacher. | C | P3 |

### 3.8 Notifications and announcements

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-NOT-01 | In-app notification centre for all roles. | S | P2 |
| FR-NOT-02 | Channels: WhatsApp (click-to-chat in P1, Business API in P2+), SMS, email, push (mobile, P3). | M | P1-P3 |
| FR-NOT-03 | Admin/teacher can publish announcements to a batch, branch or whole tenant. | S | P2 |
| FR-NOT-04 | Users can set notification preferences per channel. | C | P3 |
| FR-NOT-05 | Notifications are generated by a background job queue, not inside the request cycle. | M | P2 |

### 3.9 Reports and analytics

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-RPT-01 | Admin dashboard: total students, active batches, today's attendance, fees collected vs pending. | M | P1 |
| FR-RPT-02 | Defaulter list (students with overdue fees beyond N days). | M | P1 |
| FR-RPT-03 | Attendance trend and low-attendance alerts. | S | P2 |
| FR-RPT-04 | Weak-student detection from marks and attendance. | C | P3 |
| FR-RPT-05 | AI-generated progress summary for parents (optional, based on attendance, homework, marks). | C | P3 |

### 3.10 Permission matrix (summary)

| Capability | Admin | Teacher | Student | Parent |
|---|---|---|---|---|
| Manage branches, batches, users | Yes | No | No | No |
| Mark attendance | Yes | Own batches | No | No |
| View attendance | All | Own batches | Self | Linked children |
| Configure fee plans | Yes | No | No | No |
| Send fee reminders / mark paid | Yes | Own batches | No | No |
| View fees | All | Own batches | No | Linked children |
| Post homework / enter marks | Yes | Own batches | No | No |
| Submit homework | No | No | Yes | No |
| View marks | All | Own batches | Self | Linked children |
| View reports | All | Own batches | No | No |

---

## 4. Non-Functional Requirements

### 4.1 Security and privacy (NFR-SEC)
- **NFR-SEC-01:** Tenant isolation enforced at the database layer (PostgreSQL row-level security or equivalent) and again in the API.
- **NFR-SEC-02:** All traffic over HTTPS; passwords hashed with Argon2 or bcrypt; OTPs rate-limited and expiring.
- **NFR-SEC-03:** Uploaded files stored in private buckets and served via short-lived signed URLs.
- **NFR-SEC-04:** Student data (minors) is accessible only to authorised roles; export and delete on request.
- **NFR-SEC-05:** Audit log for sensitive actions (fee status change, attendance edits, mark edits, role changes).
- **NFR-SEC-06:** Compliance with India's DPDP Act principles: purpose limitation, consent for parent/guardian data, data retention policy. *(Verify requirements before launch to real users.)*
- **NFR-SEC-07:** Payee UPI IDs and payment references are never exposed to unauthorised roles.

### 4.2 Performance (NFR-PERF)
- Page loads under 2 s on a typical 4G connection for the dashboard views.
- API p95 latency under 400 ms for standard reads.
- Marking attendance for a batch of 50 students completes in under 5 taps/actions and saves in under 1 s.
- Support at least 10,000 students per tenant and 500 tenants on the initial deployment without redesign.

### 4.3 Reliability and availability (NFR-REL)
- Target 99.5% availability for the pilot.
- Daily automated database backups, with a tested restore.
- Notification and reminder jobs are retried idempotently; no duplicate reminders on retry.

### 4.4 Usability (NFR-USE)
- Mobile-first responsive design; large touch targets.
- Teacher flows (attendance, reminders) must be usable with no training.
- Languages: English first; Hindi and Marathi planned.
- Basic accessibility: keyboard navigation, sufficient colour contrast, labelled inputs.

### 4.5 Maintainability and portability (NFR-MNT)
- API-first design with versioned REST endpoints (`/api/v1/...`) and OpenAPI documentation.
- Environment-based configuration; containerised services; CI running tests and lint.
- Mobile app must reuse the same API with no backend changes.

### 4.6 Scalability (NFR-SCL)
- Stateless API servers behind a load balancer.
- Background workers scale independently of the API.
- Indexing strategy on `(tenant_id, ...)` for all major tables.

---

## 5. External Interfaces

### 5.1 User interfaces
Role-specific home screens: Admin dashboard, Teacher "Today" view (batches today, mark attendance, pending fees), Student view, Parent child-switcher dashboard. Mobile-first layout, consistent navigation across web and future mobile.

### 5.2 Software interfaces

| System | Purpose | Notes |
|---|---|---|
| WhatsApp click-to-chat (`wa.me`) | MVP reminders | Free; one tap per message |
| WhatsApp Business Cloud API | Automated reminders (P2+) | Needs verified business, approved templates, per-message cost |
| UPI deep link / QR | Fee payment | Standard `upi://pay` parameters (`pa`, `pn`, `am`, `cu`, `tn`) |
| Razorpay | Optional payment links/QR and webhooks | Requires teacher KYC; webhook signature verification mandatory |
| SMS provider | OTP and fallback notifications | Choose a DLT-compliant provider for India |
| Email provider | Receipts, invites | Transactional email service |
| Object storage (S3-compatible) | Homework, papers, receipts | Private bucket, signed URLs |

### 5.3 API conventions
- REST + JSON, versioned under `/api/v1`.
- Auth via bearer access tokens (short-lived) with refresh tokens.
- Pagination via cursor or `limit/offset`; consistent error format `{ code, message, details }`.
- Idempotency keys on payment-related and notification-sending endpoints.

---

## 6. Data Model (Logical)

### 6.1 Core entities

| Entity | Key fields |
|---|---|
| `tenant` | id, name, owner_id, settings, created_at |
| `branch` | id, tenant_id, name, address |
| `user` | id, phone, email, name, password_hash, status |
| `membership` | id, user_id, tenant_id, role (admin/teacher/student/parent) |
| `student` | id, tenant_id, user_id (nullable), name, grade, dob, status |
| `parent_student_link` | parent_user_id, student_id, relation |
| `batch` | id, tenant_id, branch_id, name, subject, grade, schedule, capacity |
| `batch_teacher` | batch_id, teacher_user_id |
| `enrollment` | id, student_id, batch_id, start_date, end_date, status |
| `attendance_session` | id, batch_id, date, marked_by, status (held/cancelled/holiday) |
| `attendance_record` | id, session_id, student_id, status (P/A/L/E), note |
| `fee_plan` | id, batch_id, amount, frequency, due_day, late_fee, active |
| `fee_record` | id, tenant_id, student_id, plan_id, period, amount_due, amount_paid, due_date, status |
| `payment` | id, fee_record_id, amount, mode, utr, proof_url, received_at, confirmed_by, source (manual/razorpay) |
| `reminder_log` | id, fee_record_id, channel, template, sent_by, sent_at |
| `homework` | id, batch_id, title, description, due_at, attachments |
| `submission` | id, homework_id, student_id, files, submitted_at, grade, feedback, status |
| `test` | id, batch_id, name, date, max_marks |
| `test_result` | id, test_id, student_id, marks, absent |
| `announcement` | id, tenant_id, scope, title, body, created_by |
| `notification` | id, user_id, type, payload, channel, status, sent_at |
| `audit_log` | id, tenant_id, actor_id, action, entity, before, after, at |

Every table except global user identity carries `tenant_id`.

### 6.2 Fee record status flow

```
pending ──(parent reports payment)──▶ paid_pending_verification ──(teacher confirms)──▶ paid
   │                                                │
   │                                                └──(teacher rejects)──▶ pending
   ├──(partial payment)──▶ partially_paid ──(balance paid)──▶ paid
   ├──(due date passes)──▶ overdue ──(payment confirmed)──▶ paid
   └──(admin waives)──▶ waived
```

Rules: a `paid` record is immutable except via a logged reversal; `amount_paid` is derived from confirmed `payment` rows; overdue is computed from `due_date`, not set manually.

### 6.3 Fee QR payload
`upi://pay?pa=<payee_vpa>&pn=<class_name>&am=<amount>&cu=INR&tn=FEE-<fee_record_id>`
Because plain UPI QR gives no confirmation callback, the system relies on manual confirmation (FR-FEE-08/09) unless the Razorpay path (FR-FEE-11) is enabled for that tenant.

---

## 7. Suggested Architecture

| Layer | Choice |
|---|---|
| Web frontend | Next.js + TypeScript, Tailwind |
| Backend API | FastAPI or Node.js (TypeScript), REST + OpenAPI |
| Database | PostgreSQL (Supabase or self-managed) with row-level security |
| Cache/queue | Redis (job queue for reminders, notifications, receipt generation) |
| File storage | S3-compatible bucket |
| Payments | UPI QR (core) + Razorpay (optional) |
| Notifications | `wa.me` links (P1), WhatsApp Cloud API/SMS/email (P2+) |
| Mobile (P3) | React Native / Expo consuming the same API |
| DevOps | Docker, CI/CD, error tracking, structured logging |

---

## 8. Release Plan

| Phase | Scope | Exit criteria |
|---|---|---|
| **P1: MVP** | Auth + roles, tenant/branch/batch/student setup, attendance, fee plans + dues, WhatsApp click-to-chat reminders with UPI QR, manual mark-as-paid, parent view (attendance + fees), admin dashboard | One real tuition class can run attendance and fee collection for a month |
| **P2** | Homework, tests and marks, notifications and announcements, receipts, Razorpay, automated reminders, partial payments, parent portal complete | Pilot class uses all four core flows |
| **P3** | Mobile app, analytics, chat/queries, AI summaries, multilingual UI, exports | Mobile app on Play Store; 3+ tenants onboarded |

---

## 9. Acceptance Criteria (MVP examples)

1. An admin can register a tenant, create a batch, import 30 students from CSV and link parents in under 15 minutes.
2. A teacher marks attendance for a 40-student batch in under 1 minute.
3. A teacher opens "Pending fees", taps "Remind", and WhatsApp opens with a prefilled message including amount, due date and a scannable UPI QR/link.
4. Marking a fee as paid updates the parent dashboard immediately and writes an audit entry.
5. A user from tenant A cannot retrieve any tenant B record through any API endpoint (verified by automated tests).
6. A parent with two children can switch between them and see only their own children's data.

---

## 10. Risks and Open Questions

| # | Item | Notes |
|---|---|---|
| 1 | Payment confirmation with plain UPI QR | Manual verification may annoy teachers; Razorpay path mitigates but adds KYC and fees |
| 2 | WhatsApp automation cost and approval | Business API needs verification and templates; decide when to introduce |
| 3 | Student login | Are younger students given accounts, or is everything via parent only? |
| 4 | Pricing model | Free for pilot; later per-student or per-class subscription? |
| 5 | Data protection | Confirm DPDP obligations for minors' data before onboarding external users |
| 6 | Offline support | Do teachers need offline attendance marking in low-connectivity centres? |
| 7 | Branding and domain | Name, domain, white-label per tenant? |
| 8 | Pilot partner | Identify 1-2 local tuition teachers to validate flows early |

---

## 11. Traceability Tip
Use the requirement IDs (e.g., `FR-FEE-05`) in commit messages, branch names and issue titles, and keep a simple table in your repo mapping each ID to its status (`todo`, `in progress`, `done`). This also makes a strong case study for your resume.
