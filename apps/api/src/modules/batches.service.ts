import type { CreateBatchInput } from "@tutionassist/shared";
import { desc } from "drizzle-orm";
import { withTenant } from "../db/client";
import { batches } from "../db/schema";

export const createBatch = (tenantId: string, userId: string, input: CreateBatchInput) =>
  withTenant(tenantId, async (tx) => {
    const [row] = await tx
      .insert(batches)
      .values({ ...input, tenantId, teacherUserId: userId })
      .returning();
    return row!;
  });

export const listBatches = (tenantId: string) =>
  withTenant(tenantId, (tx) => tx.select().from(batches).orderBy(desc(batches.createdAt)));
