import { createMiddleware } from "hono/factory";

export const loggerMiddleware = createMiddleware(async (c, next) => {
  const start = performance.now();
  const method = c.req.method;
  const path = c.req.path;

  await next();

  const duration = (performance.now() - start).toFixed(2);
  const status = c.res.status;

  const color =
    status >= 500
      ? "\x1b[31m" // red
      : status >= 400
        ? "\x1b[33m" // yellow
        : status >= 300
          ? "\x1b[36m" // cyan
          : "\x1b[32m"; // green

  console.log(`${color}[${method}]\x1b[0m ${path} - ${status} (${duration}ms)`);
});
