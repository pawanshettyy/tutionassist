# ADR 002: Multi-tenancy via shared tables + Postgres RLS

**Decision:** every tenant-scoped table has `tenant_id`; RLS policies compare it to the
transaction-local setting `app.tenant_id`, set by `withTenant()`.

**Why:** isolation is enforced by the database even if a query forgets a filter.

**Rules:** API connects as non-superuser `tutionassist_app`; tables use FORCE ROW LEVEL
SECURITY; users/tenants/memberships are global (login needs them before a tenant is known);
cross-tenant access is covered by `apps/api/tests/tenant-isolation.test.ts`.
