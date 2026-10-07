import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Integration test: needs a migrated Postgres reachable as the NON-superuser app role.
// Set TEST_DATABASE_URL to run it; otherwise it is skipped.
const dbUrl = process.env.TEST_DATABASE_URL;

describe.skipIf(!dbUrl)("tenant isolation", () => {
  let app: Awaited<ReturnType<(typeof import("../src/app"))["buildApp"]>>;
  let pool: (typeof import("../src/db/client"))["pool"];

  beforeAll(async () => {
    process.env.DATABASE_URL = dbUrl!;
    process.env.JWT_SECRET = "test-secret-test-secret-123";
    process.env.NODE_ENV = "test";
    ({ pool } = await import("../src/db/client"));
    const { buildApp } = await import("../src/app");
    app = await buildApp();
  });

  afterAll(async () => {
    await app?.close();
    await pool?.end();
  });

  async function register(tag: string) {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register-tenant",
      payload: {
        tenantName: `Class ${tag}`,
        name: `Owner ${tag}`,
        email: `${tag}-${Date.now()}@example.com`,
        password: "password123",
        upiVpa: "owner@okhdfc",
      },
    });
    expect(res.statusCode).toBe(201);
    return res.json().token as string;
  }

  it("never lets tenant B see tenant A's data", async () => {
    const tokenA = await register("a");
    const tokenB = await register("b");

    const created = await app.inject({
      method: "POST",
      url: "/api/v1/batches",
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { name: "Class 10 Maths", subject: "Maths" },
    });
    expect(created.statusCode).toBe(201);

    const listA = await app.inject({
      method: "GET",
      url: "/api/v1/batches",
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(listA.json().items).toHaveLength(1);

    const listB = await app.inject({
      method: "GET",
      url: "/api/v1/batches",
      headers: { authorization: `Bearer ${tokenB}` },
    });
    expect(listB.json().items).toHaveLength(0);
  });

  it("rejects unauthenticated requests", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/batches" });
    expect(res.statusCode).toBe(401);
  });
});
