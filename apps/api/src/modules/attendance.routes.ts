import { markAttendanceSchema } from "@tutionassist/shared";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireRole } from "../plugins/rbac";
import { batchSummary, markAttendance } from "./attendance.service";

export default async function attendanceRoutes(app: FastifyInstance) {
  app.post("/", { preHandler: requireRole(app, "admin", "teacher") }, async (req) =>
    markAttendance(req.user.tenantId, req.user.sub, markAttendanceSchema.parse(req.body)),
  );

  app.get("/batches/:batchId/summary", { preHandler: requireRole(app, "admin", "teacher") }, async (req) => {
    const { batchId } = z.object({ batchId: z.string().uuid() }).parse(req.params);
    return { items: await batchSummary(req.user.tenantId, batchId) };
  });
}
