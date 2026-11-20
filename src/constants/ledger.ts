export const SYSTEM_ACCOUNTS = {
  CASH_SETTLEMENT: {
    code: "ASSET_CASH_SETTLEMENT",
    name: "Cash Settlement Escrow Account",
    type: "asset" as const,
  },
  PLATFORM_FEE: {
    code: "REVENUE_PLATFORM_FEE",
    name: "Platform Transaction Fee Revenue",
    type: "revenue" as const,
  },
} as const;

export const DEFAULT_TRANSFER_FEE = 1000n;

export const USER_ACCOUNT_CODE_PREFIX = "ACC_USER_";

export const formatUserLedgerAccountCode = (userId: string): string => {
  return `${USER_ACCOUNT_CODE_PREFIX}${userId.replace(/-/g, "")}`;
};
