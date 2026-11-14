import { z } from "zod";

export const topupSchema = z.strictObject({
  amount: z
    .int({ error: "Amount must be an integer" })
    .positive("Amount must be greater than zero")
    .max(100_000_000, "Maximum topup per transaction is Rp 100.000.000"),
  source: z.string().default("BANK_TRANSFER"),
});

export const transferSchema = z.strictObject({
  recipientWalletId: z.uuid("Invalid recipient wallet ID format"),
  amount: z
    .int({ error: "Amount must be an integer" })
    .positive("Amount must be greater than zero")
    .max(10_000_000, "Maximum per transfer limit is Rp 10.000.000"),
  description: z.string().max(255).optional(),
});

export type TopupInput = z.infer<typeof topupSchema>;
export type TransferInput = z.infer<typeof transferSchema>;
