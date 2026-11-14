import { pgTable, uuid, varchar, bigint, timestamp, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.ts";
import type { WalletStatus } from "../../types/index.ts";

export const wallets = pgTable(
  "wallets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ledgerAccountId: uuid("ledger_account_id").notNull().unique(),
    currency: varchar("currency", { length: 10 }).default("IDR").notNull(),
    cachedBalance: bigint("cached_balance", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    dailyTransferLimit: bigint("daily_transfer_limit", { mode: "bigint" })
      .default(sql`25000000`)
      .notNull(),
    maxPerTransferLimit: bigint("max_per_transfer_limit", { mode: "bigint" })
      .default(sql`10000000`)
      .notNull(),
    status: varchar("status", { length: 20 }).$type<WalletStatus>().default("active").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("wallets_user_id_idx").on(table.userId),
    index("wallets_status_idx").on(table.status),
    index("wallets_user_status_idx").on(table.userId, table.status),
  ]
);

export type Wallet = typeof wallets.$inferSelect;
export type NewWallet = typeof wallets.$inferInsert;
