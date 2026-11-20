import { db } from "../../config/database.ts";
import { SYSTEM_ACCOUNTS } from "../../constants/ledger.ts";
import { ledgerAccounts } from "../schema/ledger.ts";

export async function seedSystemAccounts() {
  console.log("🌱 Seeding system ledger accounts...");

  const accountsToSeed = [SYSTEM_ACCOUNTS.CASH_SETTLEMENT, SYSTEM_ACCOUNTS.PLATFORM_FEE];

  for (const account of accountsToSeed) {
    await db
      .insert(ledgerAccounts)
      .values({
        code: account.code,
        name: account.name,
        type: account.type,
      })
      .onConflictDoNothing({ target: ledgerAccounts.code });
  }

  console.log("✅ System ledger accounts ready.");
}

if (import.meta.main) {
  await seedSystemAccounts();
  process.exit(0);
}
