import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1, { error: "DATABASE_URL must not be empty" }),
  DATABASE_READ_URL_1: z.string().optional(),
  DATABASE_READ_URL_2: z.string().optional(),
  JWT_SECRET: z.string().min(16, { error: "JWT_SECRET should be at least 16 characters long" }),
  JWT_EXPIRES_IN: z.coerce.number().int().default(3600),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Invalid environment variables configuration:");
    console.error(z.prettifyError(result.error));
    throw new Error("Invalid environment variables");
  }

  return result.data;
};

export const env = parseEnv();
export type EnvConfig = z.infer<typeof envSchema>;
