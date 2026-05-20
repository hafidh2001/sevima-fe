import { create } from "zustand";
import { jwtService } from "@/functions/jwt";
import type { AuthState, AuthStore } from "@/types/auth/store";
import { TAuthUser } from "@/types/auth";
import mockUsers from "@/data/mock-user.json";

const initialState: AuthState = {
  user: {} as TAuthUser,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
  success: null,
};

export const useAuthStore = create<AuthStore>((set) => ({
  ...initialState,

  init: async () => {
    set({ isLoading: true });

    try {
      const payload = await jwtService.getCurrentUser();

      if (payload) {
        const userData = jwtService.getUserData();
        set({
          user: userData,
          isAuthenticated: true,
          isLoading: false,
          isInitialized: true,
        });
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

  login: async (credentials) => {
    set({ isLoading: true, error: null, success: null });

    try {
      // Find user by username and password
      const foundUser = (mockUsers as TAuthUser[]).find(
        (u) =>
          u.username === credentials.username &&
          u.password === credentials.password
      );

      if (!foundUser) {
        set({
          isLoading: false,
          error: "Username atau password salah",
        });
        return false;
      }

      const userData = foundUser;

      // Generate JWT tokens from user data
      const jwtPayload = {
        id_user: String(userData.id),
        username: userData.username,
        name: userData.name,
        role: userData.role,
      };

      const { accessToken, refreshToken } =
        await jwtService.generateTokens(jwtPayload);
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
        error: null,
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
      user: {} as TAuthUser,
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
