import { Hono } from "hono";
import { authRoutes } from "./auth.routes.ts";
import { walletRoutes } from "./wallet.routes.ts";
import type { AppEnv } from "../types/index.ts";

export const apiRouter = new Hono<AppEnv>();

apiRouter.route("/auth", authRoutes);
apiRouter.route("/wallets", walletRoutes);
