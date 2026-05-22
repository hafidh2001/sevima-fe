import { create } from "zustand";
import { authApi } from "@/services/authApi";
import { jwtService } from "@/functions/jwt";
import type { AuthState, AuthStore } from "@/types/auth/store";
import type { TAuthUser } from "@/types/auth";
import { RoleEnum } from "@/types";

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
  success: null,
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  ...initialState,

  init: async () => {
    set({ isLoading: true });

    try {
      const userData = jwtService.getUserData();
      const payload = await jwtService.getCurrentUser();

      if (payload && userData) {
        // Check if token is still valid, if not try refresh
        const isValid = await get().ensureValidToken();

        if (isValid) {
          set({
            user: userData,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
          });
        } else {
          // Token refresh failed, clear auth
          jwtService.clearTokens();
          set({
            isLoading: false,
            isInitialized: true,
          });
        }
      } else {
        set({
          isLoading: false,
          isInitialized: true,
        });
      }
    } catch {
      set({
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  /**
   * Ensure access token is valid, refresh if expired
   */
  ensureValidToken: async () => {
    try {
      const tokens = jwtService.getTokens();

      if (!tokens.refreshToken) {
        return false;
      }

      // Verify access token
      const payload = await jwtService.verifyToken(tokens.accessToken || "");

      if (payload) {
        // Token still valid
        return true;
      }

      // Token expired or invalid, try refresh
      const newTokens = await authApi.refresh(tokens.refreshToken);
      jwtService.updateAccessToken(newTokens.accessToken);

      return true;
    } catch {
      // Refresh failed
      return false;
    }
  },

  login: async (credentials) => {
    set({ isLoading: true, error: null, success: null });

    try {
      const tokens = await authApi.login(credentials);

      const { accessToken, refreshToken } = tokens;

      // Decode JWT to get user data
      const payload = await jwtService.verifyToken(accessToken);

      if (!payload) {
        throw new Error("Invalid token received");
      }

      const userData: TAuthUser = {
        id: payload.sub,
        email: payload.email,
        name: payload.email.split("@")[0],
        role: payload.role as RoleEnum,
        tenantId: payload.tenantId,
      };

      jwtService.setTokens(
        accessToken,
        refreshToken,
        userData,
        credentials.rememberMe,
      );

      set({
        user: userData,
        isAuthenticated: true,
        isLoading: false,
        success: "Login berhasil",
      });

      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Terjadi kesalahan";
      set({ isLoading: false, error: message });
      return false;
    }
  },

  logout: async () => {
    jwtService.clearTokens();
    set({
      user: null,
      isAuthenticated: false,
      error: null,
      success: null,
    });
  },

  reset: () => {
    jwtService.clearTokens();
    set(initialState);
  },
}));
