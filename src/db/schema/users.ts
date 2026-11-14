import { pgTable, uuid, varchar, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import type { UserRole } from "../../types/index.ts";

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    pinHash: text("pin_hash"),
    failedPinAttempts: integer("failed_pin_attempts").default(0).notNull(),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    role: varchar("role", { length: 20 }).$type<UserRole>().default("user").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("users_role_idx").on(table.role),
    index("users_created_at_idx").on(table.createdAt),
  ]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
