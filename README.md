# TutionAssist

Multi-tenant platform for tuition classes: attendance, fee collection and reminders, homework,
test marks, and a parent portal. Web app first, mobile app later. Requirements live in
[`docs/SRS.md`](docs/SRS.md).

## Stack
TypeScript monorepo (pnpm + Turborepo) · Next.js web · Fastify API · PostgreSQL with row-level
security · Redis/BullMQ (phase 2) · Zod schemas shared across apps.

## Layout
```
apps/web          Next.js app (role-grouped routes: auth, admin, teacher, parent)
apps/api          Fastify API (modules: auth, batches, students, attendance, fees)
apps/mobile       Expo app (phase 3, placeholder)
packages/shared   Zod schemas, enums (single source of truth for API contracts)
packages/utils    UPI link builder, WhatsApp links, fee + attendance logic (unit tested)
packages/api-client  Typed fetch client used by web and later mobile
infra/docker      Postgres + Redis for local dev, DB role bootstrap
docs              SRS, architecture, requirement status, decision records
```

## Quick start
Requirements: Node 20+, pnpm 9, Docker.

```bash
pnpm install
pnpm db:up                                   # Postgres + Redis (creates the non-superuser app role)
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
pnpm db:migrate                              # applies apps/api/src/db/migrations/*.sql
pnpm dev                                     # web :3000, api :4000
```

Try the API:
```bash
curl -X POST localhost:4000/api/v1/auth/register-tenant -H 'content-type: application/json' \
  -d '{"tenantName":"Sharma Classes","name":"Mr Sharma","email":"sharma@example.com","password":"password123","upiVpa":"sharma@okhdfc"}'
```

## Tests
```bash
pnpm test    # utils unit tests always run; the tenant-isolation suite runs when TEST_DATABASE_URL is set
TEST_DATABASE_URL=postgres://tutionassist_app:tutionassist_app@localhost:5432/tutionassist pnpm test
```

## Important notes
- **The API must connect as `tutionassist_app`, not `postgres`.** Superusers bypass row-level
  security. Migrations run as the owner via `MIGRATION_DATABASE_URL`.
- Every tenant-scoped query goes through `withTenant()` (`apps/api/src/db/client.ts`).
- `apps/api/src/db/migrations/*.sql` is the schema source of truth; keep `src/db/schema` (Drizzle
  types) in sync when you change it.
- Plain UPI QR gives no payment callback, so payments are confirmed by the teacher (manual
  "record payment"). WhatsApp click-to-chat can't attach an image: the reminder message carries
  the amount and UPI ID, and the QR is shown in the app to screenshot and share.
- Auth is email + password for now. OTP login, invites, role switching and parent accounts are
  tracked in `docs/requirements-status.md`.

## Conventions
Conventional Commits (`feat(fees): ...`), branches named after requirement IDs
(`feat/FR-FEE-05-whatsapp-reminder`), `main` always deployable.
