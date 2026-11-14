import { sign } from "hono/jwt";
import { userRepository, type UserRepository } from "../repositories/user.repository.ts";
import { walletRepository, type WalletRepository } from "../repositories/wallet.repository.ts";
import { hashPassword, verifyPassword, hashPin } from "../utils/password.ts";
import { ConflictError, UnauthorizedError, NotFoundError } from "../utils/errors.ts";
import { env } from "../config/env.ts";
import type { RegisterInput, LoginInput, SetupPinInput } from "../validators/auth.validator.ts";
import type { AuthSuccessData, UserProfileData, UserRole } from "../types/index.ts";

export class AuthService {
  constructor(
    private readonly userRepo: UserRepository = userRepository,
    private readonly walletRepo: WalletRepository = walletRepository
  ) {}

  async register(input: RegisterInput): Promise<AuthSuccessData> {
    const existingUser = await this.userRepo.findByEmail(input.email);
    if (existingUser) {
      throw new ConflictError("Email already registered");
    }

    const passwordHash = await hashPassword(input.password);

    const newUser = await this.userRepo.create({
      email: input.email,
      fullName: input.fullName,
      passwordHash,
      role: "user",
    });

    // Automatically create a liability ledger account & wallet for the newly registered user
    const accountCode = `ACC_USER_${newUser.id.replace(/-/g, "")}`;
    const accountName = `Wallet Liability - ${newUser.fullName}`;
    await this.walletRepo.createWalletForUser(newUser.id, accountCode, accountName);

    // Generate JWT token
    const token = await this.generateToken(newUser.id, newUser.email, newUser.role);

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        hasPin: false,
      },
      token,
    };
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

  async setupPin(userId: string, input: SetupPinInput): Promise<{ success: boolean; message: string }> {
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
      "HS256"
    );
  }
}

export const authService = new AuthService();
