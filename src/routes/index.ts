import { Hono } from "hono";
import type { AppEnv } from "../types/index.ts";
import { authRoutes } from "./auth.routes.ts";
import { walletRoutes } from "./wallet.routes.ts";

export const apiRouter = new Hono<AppEnv>();

apiRouter.route("/auth", authRoutes);
apiRouter.route("/wallets", walletRoutes);
