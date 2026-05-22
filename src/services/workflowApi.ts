import axios from "axios";
import { jwtService } from "@/functions/jwt";
import {
  WorkflowListResponse,
  WorkflowQueryParams,
  WorkflowResponse,
} from "@/types/workflow";

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

export const workflowApi = {
  async getAll(
    params: WorkflowQueryParams = {},
  ): Promise<WorkflowListResponse> {
    try {
      const { data } = await apiClient.get<WorkflowListResponse>("workflows", {
        params,
      });
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

  async getById(id: number): Promise<WorkflowResponse> {
    try {
      const { data } = await apiClient.get<WorkflowResponse>(`workflows/${id}`);
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
