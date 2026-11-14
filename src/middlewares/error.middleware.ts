import type { ErrorHandler } from "hono";
import { ZodError, z } from "zod";
import { env } from "../config/env.ts";
import { AppError } from "../utils/errors.ts";
import { sendError } from "../utils/response.ts";

export const errorHandler: ErrorHandler = (err, c) => {
  // Handle Custom Application Errors
  if (err instanceof AppError) {
    return sendError(c, err.message, err.statusCode, err.code, err.details);
  }

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    const flattened = z.flattenError(err);
    const details = {
      ...(flattened.formErrors.length > 0 && { formErrors: flattened.formErrors }),
      ...flattened.fieldErrors,
    };
    return sendError(c, "Validation Failed", 400, "VALIDATION_ERROR", details);
  }

  // Fallback for Unexpected / Internal Server Errors
  console.error("🔥 Unhandled Server Error:", err);

  const message =
    env.NODE_ENV === "production"
      ? "Internal Server Error"
      : err.message || "Internal Server Error";

  return sendError(c, message, 500, "INTERNAL_SERVER_ERROR");
};
