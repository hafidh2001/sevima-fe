import axios from "axios";
import { jwtService } from "@/functions/jwt";
import type { WorkflowDefinition } from "@/types/workflow";

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error("API configuration is missing.");
}

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000,
});

apiClient.interceptors.request.use((config) => {
  const tokens = jwtService.getTokens();
  if (tokens.accessToken) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  return config;
});

export interface AIGenerateWorkflowResponse {
  success: boolean;
  data: {
    name: string;
    description: string;
    definition: WorkflowDefinition;
  };
}

export const aiApi = {
  async generateWorkflow(description: string): Promise<AIGenerateWorkflowResponse> {
    try {
      const { data } = await apiClient.post<AIGenerateWorkflowResponse>(
        "ai/generate-workflow",
        { description }
      );
      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const responseData = error.response?.data;
        if (responseData?.message) {
          throw new Error(responseData.message);
        }
        if (responseData?.error) {
          throw new Error(responseData.error);
        }
        throw new Error(error.message);
      }
      throw error;
    }
  },
};