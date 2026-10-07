import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import { env } from "./config/env";
import attendanceRoutes from "./modules/attendance.routes";
import authRoutes from "./modules/auth.routes";
import batchRoutes from "./modules/batches.routes";
import feeRoutes from "./modules/fees.routes";
import studentRoutes from "./modules/students.routes";
import authPlugin from "./plugins/auth";
import { registerErrorHandler } from "./plugins/error-handler";

export async function buildApp() {
  const app = Fastify({ logger: env.NODE_ENV === "test" ? false : { level: "info" } });

  await app.register(cors, { origin: env.CORS_ORIGIN.split(","), credentials: true });
  await app.register(helmet);
  await app.register(rateLimit, { max: 300, timeWindow: "1 minute" });
  await app.register(authPlugin);
  registerErrorHandler(app);

  app.get("/health", async () => ({ status: "ok" }));

  await app.register(authRoutes, { prefix: "/api/v1/auth" });
  await app.register(batchRoutes, { prefix: "/api/v1/batches" });
  await app.register(studentRoutes, { prefix: "/api/v1/students" });
  await app.register(attendanceRoutes, { prefix: "/api/v1/attendance" });
  await app.register(feeRoutes, { prefix: "/api/v1/fees" });

  return app;
}
