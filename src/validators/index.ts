import { z, type ZodSchema } from "zod";
import { zValidator } from "@hono/zod-validator";
import { sendError } from "../utils/response.ts";

export * from "./auth.validator.ts";
export * from "./wallet.validator.ts";

export const validateJson = <T extends ZodSchema>(schema: T) => {
  return zValidator("json", schema, (result, c) => {
    if (!result.success) {
      const flattened = z.flattenError(result.error);
      const details = {
        ...(flattened.formErrors.length > 0 && { formErrors: flattened.formErrors }),
        ...flattened.fieldErrors,
      };
      return sendError(c, "Validation error", 400, "VALIDATION_ERROR", details);
    }
  });
};
