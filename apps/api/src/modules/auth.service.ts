import type { LoginInput, RegisterTenantInput, Role } from "@tutionassist/shared";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { memberships, tenants, users } from "../db/schema";
import { AppError } from "../lib/errors";
import { hashPassword, verifyPassword } from "../lib/password";

export interface TokenClaims {
  sub: string;
  tenantId: string;
  role: Role;
}

export async function registerTenant(input: RegisterTenantInput): Promise<TokenClaims> {
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, input.email));
  if (existing.length > 0) throw new AppError(409, "EMAIL_TAKEN", "Email already registered");

  const passwordHash = await hashPassword(input.password);
  return db.transaction(async (tx) => {
    const [tenant] = await tx
      .insert(tenants)
      .values({ name: input.tenantName, upiVpa: input.upiVpa })
      .returning({ id: tenants.id });
    const [user] = await tx
      .insert(users)
      .values({ name: input.name, email: input.email, passwordHash })
      .returning({ id: users.id });
    await tx.insert(memberships).values({ userId: user!.id, tenantId: tenant!.id, role: "admin" });
    return { sub: user!.id, tenantId: tenant!.id, role: "admin" as Role };
  });
}

export async function login(input: LoginInput): Promise<TokenClaims> {
  const [user] = await db.select().from(users).where(eq(users.email, input.email));
  const ok = user ? await verifyPassword(input.password, user.passwordHash) : false;
  if (!user || !ok) throw new AppError(401, "INVALID_CREDENTIALS", "Wrong email or password");
  const [membership] = await db.select().from(memberships).where(eq(memberships.userId, user.id));
  if (!membership) throw new AppError(403, "NO_MEMBERSHIP", "User does not belong to any class");
  return { sub: user.id, tenantId: membership.tenantId, role: membership.role as Role };
}
