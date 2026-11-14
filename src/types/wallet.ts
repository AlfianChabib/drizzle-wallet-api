export type WalletStatus = "active" | "frozen";

export type CurrencyCode = "IDR";

export interface WalletDetails {
  id: string;
  userId: string;
  currency: string;
  balance: number;
  dailyTransferLimit: number;
  maxPerTransferLimit: number;
  status: WalletStatus;
  createdAt: Date;
}

export interface TopupResult {
  walletId: string | undefined;
  amount: number;
  newBalance: number;
  source: string;
  status: "completed" | "failed";
}

export interface TransferResult {
  senderWalletId: string;
  recipientWalletId: string;
  amount: number;
  remainingBalance: number;
  status: "completed" | "failed";
}
