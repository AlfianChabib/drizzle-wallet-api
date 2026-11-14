import { Hono } from "hono";
import { authController } from "../controllers/auth.controller.ts";
import { authMiddleware } from "../middlewares/auth.middleware.ts";
import { validateJson } from "../validators/index.ts";
import { registerSchema, loginSchema, setupPinSchema } from "../validators/auth.validator.ts";
import type { AppEnv } from "../types/index.ts";

export const authRoutes = new Hono<AppEnv>();

authRoutes.post("/register", validateJson(registerSchema), authController.register);
authRoutes.post("/login", validateJson(loginSchema), authController.login);
authRoutes.get("/me", authMiddleware, authController.getProfile);
authRoutes.post("/pin/setup", authMiddleware, validateJson(setupPinSchema), authController.setupPin);
