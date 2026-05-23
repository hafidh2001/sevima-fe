import { WorkflowStatusEnum } from "..";

export interface WorkflowResponse {
  id: number;
  name: string;
  description: string | null;
  status: WorkflowStatusEnum;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: number;
    name: string;
    email: string;
  };
  latestVersion: {
    id: number;
    version: number;
    definition: WorkflowDefinition;
    createdAt: string;
  } | null;
  versionCount: number;
  _count: {
    runs: number;
  };
}

export interface WorkflowListResponse {
  data: WorkflowResponse[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
    nextCursor: string | null;
  };
}

export interface WorkflowQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: WorkflowStatusEnum;
  name?: string;
  from?: string;
  to?: string;
}

// Workflow Definition Types
export interface WorkflowNode {
  id: string;
  type: string;
  name: string;
  config?: Record<string, unknown>;
}

export interface WorkflowEdge {
  from: string;
  to: string;
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

// API Request/Response Types
export interface CreateWorkflowPayload {
  name: string;
  description?: string;
  definition: WorkflowDefinition;
}

export interface UpdateWorkflowPayload {
  name?: string;
  description?: string;
  definition?: WorkflowDefinition;
}