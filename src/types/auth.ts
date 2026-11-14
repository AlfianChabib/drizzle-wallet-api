export type UserRole = "user" | "admin";

export interface AuthTokenPayload {
  id: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface UserSummary {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  hasPin: boolean;
}

export interface AuthSuccessData {
  user: UserSummary;
  token: string;
}

export interface UserProfileData extends UserSummary {
  createdAt: Date;
}
