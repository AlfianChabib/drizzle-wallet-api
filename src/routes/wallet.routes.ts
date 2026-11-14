import { Hono } from "hono";
import { walletController } from "../controllers/wallet.controller.ts";
import { authMiddleware } from "../middlewares/auth.middleware.ts";
import { validateJson } from "../validators/index.ts";
import { topupSchema, transferSchema } from "../validators/wallet.validator.ts";
import type { AppEnv } from "../types/index.ts";

export const walletRoutes = new Hono<AppEnv>();

// Protected routes (require JWT)
walletRoutes.use("*", authMiddleware);

walletRoutes.get("/me", walletController.getWallet);
walletRoutes.post("/topup", validateJson(topupSchema), walletController.topup);
walletRoutes.post("/transfer", validateJson(transferSchema), walletController.transfer);
