import { defineRelations } from "drizzle-orm";
import { idempotencyKeys, journalEntries, ledgerAccounts, ledgerPostings } from "./ledger.ts";
import { users } from "./users.ts";
import { wallets } from "./wallets.ts";

export const schema = {
  users,
  wallets,
  ledgerAccounts,
  journalEntries,
  ledgerPostings,
  idempotencyKeys,
};

export const relations = defineRelations(schema, (r) => ({
  users: {
    wallet: r.one.wallets({
      from: r.users.id,
      to: r.wallets.userId,
    }),
    idempotencyKeys: r.many.idempotencyKeys({
      from: r.users.id,
      to: r.idempotencyKeys.userId,
    }),
  },

  wallets: {
    user: r.one.users({
      from: r.wallets.userId,
      to: r.users.id,
    }),
    ledgerAccount: r.one.ledgerAccounts({
      from: r.wallets.ledgerAccountId,
      to: r.ledgerAccounts.id,
    }),
  },

  ledgerAccounts: {
    wallet: r.one.wallets({
      from: r.ledgerAccounts.id,
      to: r.wallets.ledgerAccountId,
    }),
    postings: r.many.ledgerPostings({
      from: r.ledgerAccounts.id,
      to: r.ledgerPostings.accountId,
    }),
  },

  journalEntries: {
    postings: r.many.ledgerPostings({
      from: r.journalEntries.id,
      to: r.ledgerPostings.journalEntryId,
    }),
  },

  ledgerPostings: {
    journalEntry: r.one.journalEntries({
      from: r.ledgerPostings.journalEntryId,
      to: r.journalEntries.id,
    }),
    account: r.one.ledgerAccounts({
      from: r.ledgerPostings.accountId,
      to: r.ledgerAccounts.id,
    }),
  },

  idempotencyKeys: {
    user: r.one.users({
      from: r.idempotencyKeys.userId,
      to: r.users.id,
    }),
  },
}));
