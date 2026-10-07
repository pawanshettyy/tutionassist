import { createBatchSchema } from "@tutionassist/shared";
import type { FastifyInstance } from "fastify";
import { requireRole } from "../plugins/rbac";
import { createBatch, listBatches } from "./batches.service";

export default async function batchRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: requireRole(app, "admin", "teacher") }, async (req) => ({
    items: await listBatches(req.user.tenantId),
  }));

  app.post("/", { preHandler: requireRole(app, "admin") }, async (req, reply) => {
    const batch = await createBatch(req.user.tenantId, req.user.sub, createBatchSchema.parse(req.body));
    return reply.code(201).send(batch);
  });
}
