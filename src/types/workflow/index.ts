import { WorkflowStatusEnum } from "..";

// Run Status Enum
export enum RunStatusEnum {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  TIMED_OUT = "TIMED_OUT",
  CANCELLED = "CANCELLED",
}

// Step Status Enum
export enum StepStatusEnum {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  SKIPPED = "SKIPPED",
}

// Step Type Enum
export enum StepTypeEnum {
  START = "START",
  END = "END",
  HTTP_CALL = "HTTP_CALL",
  SCRIPT = "SCRIPT",
  DELAY = "DELAY",
  CONDITION = "CONDITION",
}

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

// Step Run Types
export interface StepRun {
  id: number;
  stepId: string;
  stepName: string;
  stepType: StepTypeEnum;
  status: StepStatusEnum;
  retryCount: number;
  maxRetries: number;
  output: Record<string, unknown> | null;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface StepLog {
  id: number;
  stepRunId: number;
  level: "INFO" | "WARN" | "ERROR";
  message: string;
  timestamp: string;
}

// Workflow Run Types
export interface WorkflowRun {
  id: number;
  workflowDefinitionId: number;
  workflowVersionId: number;
  status: RunStatusEnum;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  stepRuns?: StepRun[];
}

export interface WorkflowRunListResponse {
  data: WorkflowRun[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
    nextCursor: string | null;
  };
}

export interface WorkflowRunStats {
  total: number;
  pending: number;
  running: number;
  success: number;
  failed: number;
  cancelled: number;
  avgDuration: number | null;
}

// Global Run Stats (for dashboard)
export interface GlobalRunStats {
  total: number;
  byStatus: {
    pending: number;
    running: number;
    success: number;
    failed: number;
    timedOut: number;
    cancelled: number;
  };
  successRate: number;
  failureRate: number;
  averageDurationMs: number;
}

export interface WorkflowRunQueryParams {
  page?: number;
  limit?: number;
  status?: RunStatusEnum;
  from?: string;
  to?: string;
  sortOrder?: "asc" | "desc";
}

// SSE Event Types
export interface StepStatusEvent {
  runId: number;
  stepId: string;
  status: StepStatusEnum;
  timestamp: string;
  output?: Record<string, unknown>;
  error?: string;
  retryCount?: number;
}

export interface RunStatusEvent {
  runId: number;
  status: RunStatusEnum;
  timestamp: string;
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

export interface TriggerWorkflowPayload {
  variables?: Record<string, unknown>;
  version?: number;
}