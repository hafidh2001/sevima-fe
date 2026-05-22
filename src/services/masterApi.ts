import axios from "axios";
import { jwtService } from "@/functions/jwt";

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error("API configuration is missing.");
}

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

apiClient.interceptors.request.use((config) => {
  const tokens = jwtService.getTokens();
  if (tokens.accessToken) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  return config;
});

export interface TenantResponse {
  id: number;
  name: string;
  slug: string;
}

export const masterApi = {
  async getTenantOptions(): Promise<TenantResponse[]> {
    try {
      const { data } = await apiClient.get<TenantResponse[]>("tenants");
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
