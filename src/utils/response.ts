import type { Context } from "hono";
import type { ApiResponse, HttpStatusCode } from "../types/index.ts";

export const sendSuccess = <T>(
  c: Context,
  data?: T,
  message?: string,
  statusCode: HttpStatusCode = 200,
) => {
  const payload: ApiResponse<T> = {
    success: true,
    ...(message && { message }),
    ...(data !== undefined && { data }),
  };
  return c.json(payload, statusCode);
};

export const sendError = (
  c: Context,
  message: string,
  statusCode: HttpStatusCode = 500,
  code: string = "INTERNAL_SERVER_ERROR",
  details?: unknown,
) => {
  const payload: ApiResponse = {
    success: false,
    message,
    error: {
      code,
      ...(details !== undefined && { details }),
    },
  };
  return c.json(payload, statusCode);
};
