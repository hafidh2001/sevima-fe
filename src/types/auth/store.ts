import { Nullable } from "@/types";
import type { ILoginRequest, TAuthUser } from ".";

export interface AuthState {
  user: TAuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: Nullable<string>;
  success: Nullable<string>;
}

export interface AuthActions {
  init: () => Promise<void>;
  ensureValidToken: () => Promise<boolean>;
  login: (credentials: ILoginRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  reset: () => void;
}

export type AuthStore = AuthState & AuthActions;
