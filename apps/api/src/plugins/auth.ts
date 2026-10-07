import jwt from "@fastify/jwt";
import type { Role } from "@tutionassist/shared";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { env } from "../config/env";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { sub: string; tenantId: string; role: Role };
    user: { sub: string; tenantId: string; role: Role };
  }
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export default fp(async function authPlugin(app: FastifyInstance) {
  await app.register(jwt, { secret: env.JWT_SECRET, sign: { expiresIn: "12h" } });
  app.decorate("authenticate", async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify();
    } catch {
      reply.code(401).send({ code: "UNAUTHORIZED", message: "Invalid or missing token" });
    }
  });
});
