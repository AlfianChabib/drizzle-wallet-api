import type { UserRole } from "./auth.ts";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export type AppVariables = {
  user: AuthUser;
};

export type AppEnv = {
  Variables: AppVariables;
};
