import {
  bigint,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import type {
  IdempotencyKeyStatus,
  JournalEntryStatus,
  JournalTransactionType,
  LedgerAccountType,
  LedgerPostingDirection,
} from "../../types/index.ts";
import { users } from "./users.ts";

export const ledgerAccounts = pgTable(
  "ledger_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 100 }).notNull().unique(),
    type: varchar("type", { length: 20 }).$type<LedgerAccountType>().notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("ledger_accounts_type_idx").on(table.type)],
);

export const journalEntries = pgTable(
  "journal_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    idempotencyKey: varchar("idempotency_key", { length: 255 }).unique(),
    transactionType: varchar("transaction_type", { length: 50 })
      .$type<JournalTransactionType>()
      .notNull(),
    status: varchar("status", { length: 20 })
      .$type<JournalEntryStatus>()
      .default("posted")
      .notNull(),
    description: text("description"),
    postedAt: timestamp("posted_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("journal_entries_posted_at_idx").on(table.postedAt),
    index("journal_entries_tx_type_status_idx").on(table.transactionType, table.status),
  ],
);

export const ledgerPostings = pgTable(
  "ledger_postings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    journalEntryId: uuid("journal_entry_id")
      .notNull()
      .references(() => journalEntries.id, { onDelete: "restrict" }),
    accountId: uuid("account_id")
      .notNull()
      .references(() => ledgerAccounts.id, { onDelete: "restrict" }),
    direction: varchar("direction", { length: 10 }).$type<LedgerPostingDirection>().notNull(),
    amount: bigint("amount", { mode: "bigint" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("ledger_postings_journal_entry_id_idx").on(table.journalEntryId),
    index("ledger_postings_account_created_at_idx").on(table.accountId, table.createdAt),
    index("ledger_postings_direction_idx").on(table.direction),
  ],
);

export const idempotencyKeys = pgTable(
  "idempotency_keys",
  {
    key: varchar("key", { length: 255 }).primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    endpoint: varchar("endpoint", { length: 255 }).notNull(),
    requestHash: varchar("request_hash", { length: 64 }).notNull(),
    status: varchar("status", { length: 20 }).$type<IdempotencyKeyStatus>().notNull(),
    statusCode: integer("status_code"),
    responseBody: jsonb("response_body"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("idempotency_keys_user_id_idx").on(table.userId),
    index("idempotency_keys_expires_at_idx").on(table.expiresAt),
    index("idempotency_keys_status_idx").on(table.status),
  ],
);

export type LedgerAccount = typeof ledgerAccounts.$inferSelect;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type LedgerPosting = typeof ledgerPostings.$inferSelect;
export type IdempotencyKey = typeof idempotencyKeys.$inferSelect;
