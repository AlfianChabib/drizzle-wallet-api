import type { NotFoundHandler } from "hono";
import { sendError } from "../utils/response.ts";

export const notFoundHandler: NotFoundHandler = (c) => {
  return sendError(
    c,
    `Route ${c.req.method} ${c.req.path} not found`,
    404,
    "NOT_FOUND"
  );
};
