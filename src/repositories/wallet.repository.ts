import { eq } from "drizzle-orm";
import { db } from "../config/database.ts";
import { type LedgerAccount, ledgerAccounts } from "../db/schema/ledger.ts";
import { type Wallet, wallets } from "../db/schema/wallets.ts";

export class WalletRepository {
  async findByUserId(userId: string): Promise<Wallet | undefined> {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
    return wallet;
  }

  async findById(id: string): Promise<Wallet | undefined> {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.id, id)).limit(1);
    return wallet;
  }

  async findAccountByCode(code: string): Promise<LedgerAccount | undefined> {
    const [account] = await db
      .select()
      .from(ledgerAccounts)
      .where(eq(ledgerAccounts.code, code))
      .limit(1);
    return account;
  }

  async createWalletForUser(
    userId: string,
    accountCode: string,
    accountName: string,
  ): Promise<Wallet> {
    return await db.transaction(async (tx) => {
      // 1. Create corresponding liability ledger account
      const [account] = await tx
        .insert(ledgerAccounts)
        .values({
          code: accountCode,
          type: "liability",
          name: accountName,
        })
        .returning();

      if (!account) throw new Error("Failed to create ledger account for wallet");

      // 2. Create wallet
      const [wallet] = await tx
        .insert(wallets)
        .values({
          userId,
          ledgerAccountId: account.id,
          currency: "IDR",
          cachedBalance: 0n,
        })
        .returning();

      if (!wallet) throw new Error("Failed to create wallet");

      return wallet;
    });
  }

  async freezeWallet(walletId: string): Promise<void> {
    await db
      .update(wallets)
      .set({
        status: "frozen",
        updatedAt: new Date(),
      })
      .where(eq(wallets.id, walletId));
  }
}

export const walletRepository = new WalletRepository();
