import type { Context } from "hono";
import { type AuthService, authService } from "../services/auth.service.ts";
import type { AppEnv, AuthSuccessData, UserProfileData } from "../types/index.ts";
import { sendSuccess } from "../utils/response.ts";
import type { LoginInput, RegisterInput, SetupPinInput } from "../validators/auth.validator.ts";

export class AuthController {
  constructor(private readonly service: AuthService = authService) {}

  register = async (c: Context<AppEnv>) => {
    const body = (await c.req.json()) as RegisterInput;
    const result: AuthSuccessData = await this.service.register(body);
    return sendSuccess(c, result, "User registered successfully", 201);
  };

  login = async (c: Context<AppEnv>) => {
    const body = (await c.req.json()) as LoginInput;
    const result: AuthSuccessData = await this.service.login(body);
    return sendSuccess(c, result, "Login successful", 200);
  };

  getProfile = async (c: Context<AppEnv>) => {
    const user = c.get("user");
    const profile: UserProfileData = await this.service.getProfile(user.id);
    return sendSuccess(c, profile, "Profile fetched successfully");
  };

  setupPin = async (c: Context<AppEnv>) => {
    const user = c.get("user");
    const body = (await c.req.json()) as SetupPinInput;
    const result = await this.service.setupPin(user.id, body);
    return sendSuccess(c, result, "PIN configured successfully");
  };
}

export const authController = new AuthController();
