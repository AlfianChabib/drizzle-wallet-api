import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";
import { env } from "../config/env.ts";
import { UnauthorizedError } from "../utils/errors.ts";
import type { AppEnv, AuthUser, UserRole } from "../types/index.ts";

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or invalid Authorization header");
  }

  const token = authHeader.substring(7);

  try {
    const payload = await verify(token, env.JWT_SECRET, "HS256");

    const id = typeof payload.id === "string" ? payload.id : undefined;
    const email = typeof payload.email === "string" ? payload.email : undefined;
    const role: UserRole = payload.role === "admin" ? "admin" : "user";

    if (!id || !email) {
      throw new UnauthorizedError("Malformed authentication token");
    }

    const user: AuthUser = { id, email, role };
    c.set("user", user);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    throw new UnauthorizedError("Invalid or expired authentication token");
  }

  await next();
});
