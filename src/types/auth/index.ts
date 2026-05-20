import { RoleEnum } from "@/types";

export type TAuthUser = {
  id: number;
  name: string;
  username: string;
  password: string;
  role: RoleEnum;
};

export interface ILoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}
