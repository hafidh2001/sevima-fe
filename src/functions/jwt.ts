import * as jose from "jose";
import type { TAuthUser } from "@/types/auth";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_DATA_KEY = "user_data";
const JWT_SECRET = import.meta.env.VITE_JWT_SECRET || "flowforge-secret-key-change-in-production";

export type JWTPayload = {
  sub: number;
  email: string;
  roleId: number;
  roleName: string;
  tenantId: number;
  type: "access" | "refresh";
  iat?: number;
  exp?: number;
};

const secret = new TextEncoder().encode(JWT_SECRET);

const setCookie = (name: string, value: string, days: number) => {
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
};

const getCookie = (name: string): string | undefined => {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : undefined;
};

const deleteCookie = (name: string) => {
  document.cookie = `${name}=; Path=/; Max-Age=0`;
};

export const jwtService = {
  /**
   * Set tokens and user data from backend login response
   */
  setTokens: (
    accessToken: string,
    refreshToken: string,
    userData: TAuthUser,
    rememberMe: boolean = false,
  ): void => {
    const expiry = rememberMe ? 7 : 1;
    setCookie(ACCESS_TOKEN_KEY, accessToken, 0.0104);
    setCookie(REFRESH_TOKEN_KEY, refreshToken, expiry);
    setCookie(USER_DATA_KEY, encodeURIComponent(JSON.stringify(userData)), expiry);
  },

  /**
   * Update only access token (keep refresh token and user data)
   */
  updateAccessToken: (accessToken: string): void => {
    setCookie(ACCESS_TOKEN_KEY, accessToken, 0.0104);
  },

  /**
   * Get tokens from cookies
   */
  getTokens: (): { accessToken?: string; refreshToken?: string } => {
    return {
      accessToken: getCookie(ACCESS_TOKEN_KEY),
      refreshToken: getCookie(REFRESH_TOKEN_KEY),
    };
  },

  /**
   * Get user data from cookies
   */
  getUserData: (): TAuthUser | null => {
    const userDataCookie = getCookie(USER_DATA_KEY);
    if (!userDataCookie) return null;
    try {
      return JSON.parse(decodeURIComponent(userDataCookie)) as TAuthUser;
    } catch {
      return null;
    }
  },

  /**
   * Verify and decode JWT token
   */
  verifyToken: async (token: string): Promise<JWTPayload | null> => {
    try {
      const { payload } = await jose.jwtVerify(token, secret);
      return payload as unknown as JWTPayload;
    } catch {
      return null;
    }
  },

  /**
   * Get current user from stored token
   */
  getCurrentUser: async (): Promise<JWTPayload | null> => {
    const { accessToken } = jwtService.getTokens();
    if (!accessToken) return null;
    return jwtService.verifyToken(accessToken);
  },

  /**
   * Clear all auth cookies
   */
  clearTokens: (): void => {
    deleteCookie(ACCESS_TOKEN_KEY);
    deleteCookie(REFRESH_TOKEN_KEY);
    deleteCookie(USER_DATA_KEY);
  },
};
