import type { Role } from "@tutionassist/shared";
import type { FastifyReply, FastifyRequest } from "fastify";

/** preHandler list: authenticate, then require one of the given roles. */
export function requireRole(app: { authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void> }, ...roles: Role[]) {
  return [
    app.authenticate,
    async (req: FastifyRequest, reply: FastifyReply) => {
      if (!roles.includes(req.user.role)) {
        reply.code(403).send({ code: "FORBIDDEN", message: "Your role cannot do this" });
      }
    },
  ];
}
