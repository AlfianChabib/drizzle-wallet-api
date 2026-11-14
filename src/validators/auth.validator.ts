import { z } from "zod";

export const registerSchema = z.strictObject({
  email: z.email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
});

export const loginSchema = z.strictObject({
  email: z.email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const setupPinSchema = z.strictObject({
  pin: z.string().regex(/^\d{6}$/, "PIN must be exactly 6 digits"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SetupPinInput = z.infer<typeof setupPinSchema>;
