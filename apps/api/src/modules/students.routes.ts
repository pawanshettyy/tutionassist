import { createStudentSchema, enrollStudentSchema } from "@tutionassist/shared";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireRole } from "../plugins/rbac";
import { createStudent, enrollStudent, listBatchStudents, listStudents } from "./students.service";

export default async function studentRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: requireRole(app, "admin", "teacher") }, async (req) => ({
    items: await listStudents(req.user.tenantId),
  }));

  app.post("/", { preHandler: requireRole(app, "admin") }, async (req, reply) => {
    const student = await createStudent(req.user.tenantId, createStudentSchema.parse(req.body));
    return reply.code(201).send(student);
  });

  app.post("/batches/:batchId/enroll", { preHandler: requireRole(app, "admin") }, async (req, reply) => {
    const { batchId } = z.object({ batchId: z.string().uuid() }).parse(req.params);
    const { studentId } = enrollStudentSchema.parse(req.body);
    return reply.code(201).send(await enrollStudent(req.user.tenantId, batchId, studentId));
  });

  app.get("/batches/:batchId", { preHandler: requireRole(app, "admin", "teacher") }, async (req) => {
    const { batchId } = z.object({ batchId: z.string().uuid() }).parse(req.params);
    return { items: await listBatchStudents(req.user.tenantId, batchId) };
  });
}
