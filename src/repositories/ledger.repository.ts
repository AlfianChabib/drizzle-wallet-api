import { eq } from "drizzle-orm";
import { type DbClient, db } from "../config/database.ts";
import { type LedgerAccount, ledgerAccounts, type NewLedgerAccount } from "../db/schema/ledger.ts";

export class LedgerRepository {
  async findById(id: string, client: DbClient = db): Promise<LedgerAccount | undefined> {
    const [account] = await client
      .select()
      .from(ledgerAccounts)
      .where(eq(ledgerAccounts.id, id))
      .limit(1);
    return account;
  }

  async findByCode(code: string, client: DbClient = db): Promise<LedgerAccount | undefined> {
    const [account] = await client
      .select()
      .from(ledgerAccounts)
      .where(eq(ledgerAccounts.code, code))
      .limit(1);
    return account;
  }

  async createAccount(data: NewLedgerAccount, client: DbClient = db): Promise<LedgerAccount> {
    const [account] = await client.insert(ledgerAccounts).values(data).returning();
    if (!account) throw new Error("Failed to create ledger account");
    return account;
  }
}

export const ledgerRepository = new LedgerRepository();
