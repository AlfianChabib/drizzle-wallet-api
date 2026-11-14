import { walletRepository, type WalletRepository } from "../repositories/wallet.repository.ts";
import { userRepository, type UserRepository } from "../repositories/user.repository.ts";
import { NotFoundError, BadRequestError, ForbiddenError } from "../utils/errors.ts";
import { verifyPin } from "../utils/password.ts";
import type { TopupInput, TransferInput } from "../validators/wallet.validator.ts";
import type { WalletDetails, TopupResult, TransferResult } from "../types/index.ts";
import { db } from "../config/database.ts";
import { wallets } from "../db/schema/wallets.ts";
import { eq } from "drizzle-orm";

export class WalletService {
  constructor(
    private readonly walletRepo: WalletRepository = walletRepository,
    private readonly userRepo: UserRepository = userRepository
  ) {}

  async getWalletByUserId(userId: string): Promise<WalletDetails> {
    const wallet = await this.walletRepo.findByUserId(userId);
    if (!wallet) {
      throw new NotFoundError("Wallet not found for this user");
    }

    return {
      id: wallet.id,
      userId: wallet.userId,
      currency: wallet.currency,
      balance: Number(wallet.cachedBalance),
      dailyTransferLimit: Number(wallet.dailyTransferLimit),
      maxPerTransferLimit: Number(wallet.maxPerTransferLimit),
      status: wallet.status,
      createdAt: wallet.createdAt,
    };
  }

  async topup(userId: string, input: TopupInput): Promise<TopupResult> {
    const wallet = await this.walletRepo.findByUserId(userId);
    if (!wallet) {
      throw new NotFoundError("Wallet not found");
    }

    if (wallet.status === "frozen") {
      throw new ForbiddenError("Wallet is frozen. Cannot perform transactions.");
    }

    const amountBigInt = BigInt(input.amount);

    // Update wallet balance atomically
    const [updated] = await db
      .update(wallets)
      .set({
        cachedBalance: wallet.cachedBalance + amountBigInt,
        updatedAt: new Date(),
      })
      .where(eq(wallets.id, wallet.id))
      .returning();

    return {
      walletId: updated?.id,
      amount: input.amount,
      newBalance: Number(updated?.cachedBalance ?? 0n),
      source: input.source,
      status: "completed",
    };
  }

  async transfer(senderUserId: string, input: TransferInput, pin?: string): Promise<TransferResult> {
    if (!pin) {
      throw new BadRequestError("Missing X-Transaction-PIN header");
    }

    const sender = await this.userRepo.findById(senderUserId);
    if (!sender || !sender.pinHash) {
      throw new BadRequestError("Please setup transaction PIN first");
    }

    // Verify PIN with brute-force counter
    const isPinValid = await verifyPin(pin, sender.pinHash);
    if (!isPinValid) {
      const attempts = await this.userRepo.incrementFailedPin(senderUserId);
      if (attempts >= 5) {
        const senderWallet = await this.walletRepo.findByUserId(senderUserId);
        if (senderWallet) {
          await this.walletRepo.freezeWallet(senderWallet.id);
        }
        throw new ForbiddenError("PIN entered incorrectly 5 times. Your wallet has been frozen.");
      }
      throw new BadRequestError(`Incorrect PIN. ${5 - attempts} attempts remaining.`);
    }

    // Reset failed attempts if valid
    await this.userRepo.resetFailedPin(senderUserId);

    const amountBigInt = BigInt(input.amount);

    return await db.transaction(async (tx) => {
      // Pessimistic Locking on sender wallet (SELECT ... FOR UPDATE)
      const [senderWallet] = await tx
        .select()
        .from(wallets)
        .where(eq(wallets.userId, senderUserId))
        .for("update");

      if (!senderWallet) {
        throw new NotFoundError("Sender wallet not found");
      }

      if (senderWallet.status === "frozen") {
        throw new ForbiddenError("Sender wallet is frozen");
      }

      if (senderWallet.cachedBalance < amountBigInt) {
        throw new BadRequestError("Insufficient wallet balance");
      }

      // Check recipient wallet
      const [recipientWallet] = await tx
        .select()
        .from(wallets)
        .where(eq(wallets.id, input.recipientWalletId))
        .for("update");

      if (!recipientWallet) {
        throw new NotFoundError("Recipient wallet not found");
      }

      if (recipientWallet.id === senderWallet.id) {
        throw new BadRequestError("Cannot transfer funds to the same wallet");
      }

      if (recipientWallet.status === "frozen") {
        throw new BadRequestError("Recipient wallet is frozen and cannot receive funds");
      }

      // Update balances
      await tx
        .update(wallets)
        .set({
          cachedBalance: senderWallet.cachedBalance - amountBigInt,
          updatedAt: new Date(),
        })
        .where(eq(wallets.id, senderWallet.id));

      await tx
        .update(wallets)
        .set({
          cachedBalance: recipientWallet.cachedBalance + amountBigInt,
          updatedAt: new Date(),
        })
        .where(eq(wallets.id, recipientWallet.id));

      return {
        senderWalletId: senderWallet.id,
        recipientWalletId: recipientWallet.id,
        amount: input.amount,
        remainingBalance: Number(senderWallet.cachedBalance - amountBigInt),
        status: "completed",
      };
    });
  }
}

export const walletService = new WalletService();
