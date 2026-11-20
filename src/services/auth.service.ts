import { sign } from "hono/jwt";
import { db } from "../config/database.ts";
import { env } from "../config/env.ts";
import { formatUserLedgerAccountCode } from "../constants/ledger.ts";
import {
  DEFAULT_DAILY_TRANSFER_LIMIT,
  DEFAULT_MAX_PER_TRANSFER_LIMIT,
  DEFAULT_WALLET_CURRENCY,
} from "../constants/wallet.ts";
import { type LedgerRepository, ledgerRepository } from "../repositories/ledger.repository.ts";
import { type UserRepository, userRepository } from "../repositories/user.repository.ts";
import { type WalletRepository, walletRepository } from "../repositories/wallet.repository.ts";
import type { AuthSuccessData, UserProfileData, UserRole } from "../types/index.ts";
import { ConflictError, NotFoundError, UnauthorizedError } from "../utils/errors.ts";
import { hashPassword, hashPin, verifyPassword } from "../utils/password.ts";
import type { LoginInput, RegisterInput, SetupPinInput } from "../validators/auth.validator.ts";

export class AuthService {
  constructor(
    private readonly userRepo: UserRepository = userRepository,
    private readonly walletRepo: WalletRepository = walletRepository,
    private readonly ledgerRepo: LedgerRepository = ledgerRepository,
  ) {}

  async register(input: RegisterInput): Promise<AuthSuccessData> {
    // 1. Check for existing user with identical email
    const existingUser = await this.userRepo.findByEmail(input.email);
    if (existingUser) {
      throw new ConflictError("Email already registered");
    }

    // 2. Hash password with Argon2id before starting database transaction
    const passwordHash = await hashPassword(input.password);

    try {
      // 3. Atomic Database Transaction: User + Ledger Account + Wallet
      const result = await db.transaction(async (tx) => {
        // Create User
        const newUser = await this.userRepo.create(
          {
            id: Bun.randomUUIDv7(),
            email: input.email,
            passwordHash,
            fullName: input.fullName,
            role: "user",
            failedPinAttempts: 0,
          },
          tx,
        );

        // Create Liability Ledger Account
        const accountCode = formatUserLedgerAccountCode(newUser.id);
        const accountName = `Wallet Liability - ${newUser.fullName}`;
        const newLedgerAccount = await this.ledgerRepo.createAccount(
          {
            id: Bun.randomUUIDv7(),
            code: accountCode,
            type: "liability",
            name: accountName,
          },
          tx,
        );

        // Create Wallet with initial zero balance
        const newWallet = await this.walletRepo.create(
          {
            id: Bun.randomUUIDv7(),
            userId: newUser.id,
            ledgerAccountId: newLedgerAccount.id,
            currency: DEFAULT_WALLET_CURRENCY,
            cachedBalance: 0n,
            dailyTransferLimit: DEFAULT_DAILY_TRANSFER_LIMIT,
            maxPerTransferLimit: DEFAULT_MAX_PER_TRANSFER_LIMIT,
            status: "active",
          },
          tx,
        );

        return { newUser, newLedgerAccount, newWallet };
      });

      // 4. Generate JWT access token
      const token = await this.generateToken(
        result.newUser.id,
        result.newUser.email,
        result.newUser.role,
      );

      return {
        user: {
          id: result.newUser.id,
          email: result.newUser.email,
          fullName: result.newUser.fullName,
          role: result.newUser.role,
          hasPin: false,
        },
        token,
      };
    } catch (error: unknown) {
      // PostgreSQL unique violation error code 23505 (e.g. concurrent registration race condition)
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code: string }).code === "23505"
      ) {
        throw new ConflictError("Email already registered");
      }
      throw error;
    }
  }

  async login(input: LoginInput): Promise<AuthSuccessData> {
    const user = await this.userRepo.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isMatch = await verifyPassword(input.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const token = await this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        hasPin: Boolean(user.pinHash),
      },
      token,
    };
  }

  async getProfile(userId: string): Promise<UserProfileData> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      hasPin: Boolean(user.pinHash),
      createdAt: user.createdAt,
    };
  }

  async setupPin(
    userId: string,
    input: SetupPinInput,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const pinHash = await hashPin(input.pin);
    await this.userRepo.updatePin(userId, pinHash);

    return { success: true, message: "Transaction PIN configured successfully" };
  }

  private async generateToken(id: string, email: string, role: UserRole): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    return await sign(
      {
        id,
        email,
        role,
        iat: now,
        exp: now + env.JWT_EXPIRES_IN,
      },
      env.JWT_SECRET,
      "HS256",
    );
  }
}

export const authService = new AuthService();
