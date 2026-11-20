import { beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import { db } from "../../src/config/database.ts";
import type { LedgerAccount } from "../../src/db/schema/ledger.ts";
import type { User } from "../../src/db/schema/users.ts";
import type { Wallet } from "../../src/db/schema/wallets.ts";
import type { LedgerRepository } from "../../src/repositories/ledger.repository.ts";
import type { UserRepository } from "../../src/repositories/user.repository.ts";
import type { WalletRepository } from "../../src/repositories/wallet.repository.ts";
import { AuthService } from "../../src/services/auth.service.ts";
import { ConflictError } from "../../src/utils/errors.ts";
import { verifyPassword } from "../../src/utils/password.ts";

describe("AuthService.register", () => {
  let mockUserRepo: Partial<UserRepository>;
  let mockWalletRepo: Partial<WalletRepository>;
  let mockLedgerRepo: Partial<LedgerRepository>;
  let authService: AuthService;

  beforeEach(() => {
    mockUserRepo = {
      findByEmail: mock(async () => undefined),
      create: mock(async (data) => ({
        id: data.id ?? "01a1f6c4-7d9e-709c-9e37-9a0271807396",
        email: data.email,
        passwordHash: data.passwordHash,
        pinHash: null,
        failedPinAttempts: 0,
        fullName: data.fullName,
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User)),
    };

    mockLedgerRepo = {
      createAccount: mock(async (data) => ({
        id: data.id ?? "01a1f6c4-7d9e-709c-9e37-9a0271807397",
        code: data.code,
        type: data.type,
        name: data.name,
        createdAt: new Date(),
      } as LedgerAccount)),
    };

    mockWalletRepo = {
      create: mock(async (data) => ({
        id: data.id ?? "01a1f6c4-7d9e-709c-9e37-9a0271807398",
        userId: data.userId,
        ledgerAccountId: data.ledgerAccountId,
        currency: data.currency ?? "IDR",
        cachedBalance: data.cachedBalance ?? 0n,
        dailyTransferLimit: data.dailyTransferLimit ?? 25_000_000n,
        maxPerTransferLimit: data.maxPerTransferLimit ?? 10_000_000n,
        status: data.status ?? "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Wallet)),
    };

    authService = new AuthService(
      mockUserRepo as UserRepository,
      mockWalletRepo as WalletRepository,
      mockLedgerRepo as LedgerRepository,
    );
  });

  it("should throw ConflictError if email is already registered", async () => {
    mockUserRepo.findByEmail = mock(async () => ({ id: "existing-id" } as User));

    expect(
      authService.register({
        email: "existing@example.com",
        password: "Password123",
        fullName: "Existing User",
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("should atomically create user, liability ledger account, and wallet in a transaction", async () => {
    // Spy on db.transaction to execute callback with mock transaction client
    const transactionSpy = spyOn(db, "transaction").mockImplementation(async (callback: any) => {
      const mockTx = {};
      return await callback(mockTx);
    });

    const result = await authService.register({
      email: "newuser@example.com",
      password: "SecurePassword123",
      fullName: "New Customer",
    });

    expect(transactionSpy).toHaveBeenCalled();
    expect(mockUserRepo.create).toHaveBeenCalled();
    expect(mockLedgerRepo.createAccount).toHaveBeenCalled();
    expect(mockWalletRepo.create).toHaveBeenCalled();

    // Verify user creation arguments
    const userCreateArgs = (mockUserRepo.create as any).mock.calls[0][0];
    expect(userCreateArgs.email).toBe("newuser@example.com");
    expect(userCreateArgs.fullName).toBe("New Customer");
    expect(userCreateArgs.role).toBe("user");
    // Verify password was hashed using Argon2id
    expect(await verifyPassword("SecurePassword123", userCreateArgs.passwordHash)).toBe(true);

    // Verify ledger account creation arguments
    const ledgerCreateArgs = (mockLedgerRepo.createAccount as any).mock.calls[0][0];
    expect(ledgerCreateArgs.type).toBe("liability");
    expect(ledgerCreateArgs.name).toBe("Wallet Liability - New Customer");
    expect(ledgerCreateArgs.code).toMatch(/^ACC_USER_[a-f0-9]{32}$/);

    // Verify wallet creation arguments
    const walletCreateArgs = (mockWalletRepo.create as any).mock.calls[0][0];
    expect(walletCreateArgs.currency).toBe("IDR");
    expect(walletCreateArgs.cachedBalance).toBe(0n);
    expect(walletCreateArgs.status).toBe("active");
    expect(walletCreateArgs.dailyTransferLimit).toBe(25_000_000n);
    expect(walletCreateArgs.maxPerTransferLimit).toBe(10_000_000n);

    // Verify return format
    expect(result.user).toEqual({
      id: expect.any(String),
      email: "newuser@example.com",
      fullName: "New Customer",
      role: "user",
      hasPin: false,
    });
    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe("string");

    transactionSpy.mockRestore();
  });

  it("should rollback and throw if ledger account or wallet creation fails inside transaction", async () => {
    mockLedgerRepo.createAccount = mock(async () => {
      throw new Error("Database error while creating ledger account");
    });

    const transactionSpy = spyOn(db, "transaction").mockImplementation(async (callback: any) => {
      return await callback({});
    });

    expect(
      authService.register({
        email: "fail@example.com",
        password: "Password123",
        fullName: "Failing User",
      }),
    ).rejects.toThrow("Database error while creating ledger account");

    transactionSpy.mockRestore();
  });

  it("should translate PostgreSQL unique violation error code 23505 to ConflictError", async () => {
    const pgError = new Error("duplicate key value violates unique constraint");
    (pgError as any).code = "23505";

    const transactionSpy = spyOn(db, "transaction").mockImplementation(async () => {
      throw pgError;
    });

    expect(
      authService.register({
        email: "race@example.com",
        password: "Password123",
        fullName: "Race Condition User",
      }),
    ).rejects.toThrow(ConflictError);

    transactionSpy.mockRestore();
  });
});
