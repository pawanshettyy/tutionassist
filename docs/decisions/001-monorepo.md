# ADR 001: Single TypeScript monorepo

**Decision:** one GitHub repo with pnpm workspaces + Turborepo holding web, API, mobile (later)
and shared packages.

**Why:** shared Zod schemas keep web, API and mobile contracts in sync; one CI pipeline; easy
for a solo developer.

**Trade-off:** workspace packages are built with tsup, so run `pnpm build` (Turborepo does this
automatically for dev/test/typecheck) after changing them.
