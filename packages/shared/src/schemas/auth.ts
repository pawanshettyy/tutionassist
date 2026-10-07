import { z } from "zod";

export const registerTenantSchema = z.object({
  tenantName: z.string().min(2).max(120),
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  upiVpa: z.string().min(3).max(100).optional(),
});
export type RegisterTenantInput = z.infer<typeof registerTenantSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;
