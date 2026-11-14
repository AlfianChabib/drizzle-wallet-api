import type { Context } from "hono";
import { authService, type AuthService } from "../services/auth.service.ts";
import { sendSuccess } from "../utils/response.ts";
import type { RegisterInput, LoginInput, SetupPinInput } from "../validators/auth.validator.ts";
import type { AppEnv, AuthSuccessData, UserProfileData } from "../types/index.ts";

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
