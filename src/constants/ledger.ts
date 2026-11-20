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
