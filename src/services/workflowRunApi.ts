import axios from "axios";
import { jwtService } from "@/functions/jwt";
import {
  WorkflowRunListResponse,
  WorkflowRunQueryParams,
  WorkflowRun,
  WorkflowRunStats,
  TriggerWorkflowPayload,
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

export const workflowRunApi = {
  async trigger(
    workflowId: number,
    payload?: TriggerWorkflowPayload
  ): Promise<WorkflowRun> {
    try {
      const { data } = await apiClient.post<WorkflowRun>(
        `workflows/${workflowId}/runs`,
        payload || {}
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

  async getAll(
    workflowId: number,
    params: WorkflowRunQueryParams = {}
  ): Promise<WorkflowRunListResponse> {
    try {
      const { data } = await apiClient.get<WorkflowRunListResponse>(
        `workflows/${workflowId}/runs`,
        { params }
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

  async getById(
    workflowId: number,
    runId: number
  ): Promise<WorkflowRun> {
    try {
      const { data } = await apiClient.get<WorkflowRun>(
        `workflows/${workflowId}/runs/${runId}`
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

  async getStats(workflowId: number): Promise<WorkflowRunStats> {
    try {
      const { data } = await apiClient.get<WorkflowRunStats>(
        `workflows/${workflowId}/runs/stats`
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

  async cancel(workflowId: number, runId: number): Promise<void> {
    try {
      await apiClient.post(`workflows/${workflowId}/runs/${runId}/cancel`);
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

  async retry(workflowId: number, runId: number): Promise<WorkflowRun> {
    try {
      const { data } = await apiClient.post<WorkflowRun>(
        `workflows/${workflowId}/runs/${runId}/retry`
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
