import {
  createFeePlanSchema,
  generateFeeRecordsSchema,
  listFeesQuerySchema,
  recordPaymentSchema,
} from "@tutionassist/shared";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireRole } from "../plugins/rbac";
import { createPlan, generateRecords, listFees, prepareReminder, recordPayment } from "./fees.service";

const idParam = z.object({ id: z.string().uuid() });

export default async function feeRoutes(app: FastifyInstance) {
  const staff = requireRole(app, "admin", "teacher");

  app.post("/plans", { preHandler: requireRole(app, "admin") }, async (req, reply) => {
    const plan = await createPlan(req.user.tenantId, createFeePlanSchema.parse(req.body));
    return reply.code(201).send(plan);
  });

  app.post("/plans/:id/generate", { preHandler: requireRole(app, "admin") }, async (req) => {
    const { id } = idParam.parse(req.params);
    const { period } = generateFeeRecordsSchema.parse(req.body);
    return generateRecords(req.user.tenantId, id, period);
  });

  app.get("/", { preHandler: staff }, async (req) => ({
    items: await listFees(req.user.tenantId, listFeesQuerySchema.parse(req.query)),
  }));

  app.post("/:id/reminder", { preHandler: staff }, async (req) => {
    const { id } = idParam.parse(req.params);
    return prepareReminder(req.user.tenantId, req.user.sub, id);
  });

  app.post("/:id/payments", { preHandler: staff }, async (req) => {
    const { id } = idParam.parse(req.params);
    return recordPayment(req.user.tenantId, req.user.sub, id, recordPaymentSchema.parse(req.body));
  });
}
