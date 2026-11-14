export type LedgerAccountType = "asset" | "liability" | "revenue" | "expense";

export type LedgerPostingDirection = "debit" | "credit";

export type JournalTransactionType = "topup" | "transfer" | "withdrawal" | "adjustment";

export type JournalEntryStatus = "posted" | "failed" | "reversed";

export type IdempotencyKeyStatus = "processing" | "completed" | "failed";
