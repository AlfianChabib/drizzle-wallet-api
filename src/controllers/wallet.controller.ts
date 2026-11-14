import type { Context } from "hono";
import { type WalletService, walletService } from "../services/wallet.service.ts";
import type { AppEnv, TopupResult, TransferResult, WalletDetails } from "../types/index.ts";
import { sendSuccess } from "../utils/response.ts";
import type { TopupInput, TransferInput } from "../validators/wallet.validator.ts";

export class WalletController {
  constructor(private readonly service: WalletService = walletService) {}

  getWallet = async (c: Context<AppEnv>) => {
    const user = c.get("user");
    const wallet: WalletDetails = await this.service.getWalletByUserId(user.id);
    return sendSuccess(c, wallet, "Wallet retrieved successfully");
  };

  topup = async (c: Context<AppEnv>) => {
    const user = c.get("user");
    const body = (await c.req.json()) as TopupInput;
    const result: TopupResult = await this.service.topup(user.id, body);
    return sendSuccess(c, result, "Topup executed successfully", 201);
  };

  transfer = async (c: Context<AppEnv>) => {
    const user = c.get("user");
    const pin = c.req.header("X-Transaction-PIN");
    const body = (await c.req.json()) as TransferInput;
    const result: TransferResult = await this.service.transfer(user.id, body, pin);
    return sendSuccess(c, result, "Transfer executed successfully", 200);
  };
}

export const walletController = new WalletController();
