import axios from "axios";
import type { ILoginRequest, TokenResponse } from "@/types/auth";

// API Configuration from environment variables
const API_URL = import.meta.env.VITE_API_URL;

// Validate environment variables
if (!API_URL) {
  throw new Error(
    "API configuration is missing. Please check environment variables.",
  );
}

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

export const authApi = {
  /**
   * Login user - returns tokens directly from backend (not wrapped in ApiResponse)
   */
  async login(credentials: ILoginRequest): Promise<TokenResponse> {
    try {
      // Only send email and password to backend (rememberMe is frontend-only)
      const { email, password } = credentials;
      const { data } = await apiClient.post<TokenResponse>(
        "auth/login",
        { email, password },
      );

      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const responseData = error.response?.data;
        if (responseData?.message) {
          throw new Error(responseData.message);
        }
        throw new Error(error.message);
      }
      throw error;
    }
  },
};
