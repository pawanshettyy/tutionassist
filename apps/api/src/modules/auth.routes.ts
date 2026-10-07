import { loginSchema, registerTenantSchema } from "@tutionassist/shared";
import type { FastifyInstance } from "fastify";
import { login, registerTenant } from "./auth.service";

export default async function authRoutes(app: FastifyInstance) {
  app.post("/register-tenant", async (req, reply) => {
    const claims = await registerTenant(registerTenantSchema.parse(req.body));
    return reply.code(201).send({ token: app.jwt.sign(claims) });
  });

  app.post("/login", async (req) => {
    const claims = await login(loginSchema.parse(req.body));
    return { token: app.jwt.sign(claims) };
  });

  app.get("/me", { preHandler: [app.authenticate] }, async (req) => ({
    userId: req.user.sub,
    tenantId: req.user.tenantId,
    role: req.user.role,
  }));
}
