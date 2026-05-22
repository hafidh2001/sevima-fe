import axios from "axios";

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

export interface TenantOption {
  id: number;
  name: string;
  slug: string;
}

export const tenantApi = {
  async getAll(): Promise<TenantOption[]> {
    try {
      const { data } = await apiClient.get<TenantOption[]>("tenants");
      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.message);
      }
      throw error;
    }
  },
};
