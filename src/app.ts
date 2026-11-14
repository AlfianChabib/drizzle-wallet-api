import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { errorHandler } from "./middlewares/error.middleware.ts";
import { loggerMiddleware } from "./middlewares/logger.middleware.ts";
import { notFoundHandler } from "./middlewares/not-found.middleware.ts";
import { apiRouter } from "./routes/index.ts";
import type { AppEnv } from "./types/index.ts";
import { sendSuccess } from "./utils/response.ts";

const app = new Hono<AppEnv>();

// Global Middlewares
app.use("*", cors());
app.use("*", secureHeaders());
app.use("*", loggerMiddleware);

// Global Error and 404 Handlers
app.onError(errorHandler);
app.notFound(notFoundHandler);

// Health Check Endpoint
app.get("/health", (c) => {
  return sendSuccess(
    c,
    {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    "Service is healthy",
  );
});

// Mount API v1
app.route("/api/v1", apiRouter);

export { app };
export default app;
