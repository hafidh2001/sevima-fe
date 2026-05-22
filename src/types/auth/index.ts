import type { RoleEnum } from "@/types";

export type TAuthUser = {
  id: number;
  email: string;
  name: string;
  role: RoleEnum;
  tenantId: number;
};

export interface ILoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}
