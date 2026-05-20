import * as jose from "jose";
import { RoleEnum } from "@/types";
import type { TAuthUser } from "@/types/auth";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_DATA_KEY = "user_data";
const JWT_SECRET = import.meta.env.VITE_JWT_SECRET || "logbook-secret-key-change-in-production";
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

export type JWTPayload = {
  id_user: string;
  username: string;
  name: string;
  role: RoleEnum;
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
   * Generate access and refresh tokens
   */
  generateTokens: async (payload: JWTPayload): Promise<{
    accessToken: string;
    refreshToken: string;
  }> => {
    const accessToken = await new jose.SignJWT({ ...payload })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(ACCESS_TOKEN_EXPIRY)
      .sign(secret);

    const refreshToken = await new jose.SignJWT({ ...payload })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(REFRESH_TOKEN_EXPIRY)
      .sign(secret);

    return { accessToken, refreshToken };
  },

  /**
   * Set tokens and user data in cookies
   * @param rememberMe - if true, keep user logged in for 7 days, otherwise 1 day
   */
  setTokens: (accessToken: string, refreshToken: string, userData: TAuthUser, rememberMe: boolean = false): void => {
    setCookie(ACCESS_TOKEN_KEY, accessToken, 0.0104); // ~15 minutes
    const refreshExpiry = rememberMe ? 7 : 1; // 7 days if remember me, 1 day otherwise
    setCookie(REFRESH_TOKEN_KEY, refreshToken, refreshExpiry);
    // Store user data as JSON cookie
    setCookie(USER_DATA_KEY, encodeURIComponent(JSON.stringify(userData)), refreshExpiry);
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
  getUserData: (): TAuthUser => {
    const userDataCookie = getCookie(USER_DATA_KEY);
    if (!userDataCookie) return {} as TAuthUser;
    try {
      return JSON.parse(decodeURIComponent(userDataCookie)) as TAuthUser;
    } catch {
      return {} as TAuthUser;
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
   * Get current user from cookies
   */
  getCurrentUser: async (): Promise<JWTPayload | null> => {
    const { accessToken } = jwtService.getTokens();

    if (!accessToken) {
      return null;
    }

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

  /**
   * Refresh access token using refresh token
   */
  refreshAccessToken: async (): Promise<boolean> => {
    const { refreshToken } = jwtService.getTokens();

    if (!refreshToken) {
      return false;
    }

    const payload = await jwtService.verifyToken(refreshToken);

    if (!payload) {
      return false;
    }

    // Get existing user data
    const userData = jwtService.getUserData();

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } =
      await jwtService.generateTokens(payload);

    jwtService.setTokens(accessToken, newRefreshToken, userData!);

    return true;
  },
};
