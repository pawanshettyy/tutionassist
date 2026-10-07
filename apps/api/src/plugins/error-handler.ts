import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { AppError } from "../lib/errors";

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((err, req, reply) => {
    if (err instanceof ZodError) {
      return reply.code(400).send({ code: "VALIDATION_ERROR", message: "Invalid input", details: err.flatten() });
    }
    if (err instanceof AppError) {
      return reply.code(err.statusCode).send({ code: err.code, message: err.message });
    }
    const status = (err as { statusCode?: number }).statusCode;
    if (status && status < 500) {
      return reply.code(status).send({ code: "REQUEST_ERROR", message: (err as Error).message });
    }
    req.log.error(err);
    return reply.code(500).send({ code: "INTERNAL", message: "Something went wrong" });
  });
}
