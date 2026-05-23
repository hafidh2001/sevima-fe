import { Nullable } from "@/types";
import {
  WorkflowQueryParams,
  WorkflowResponse,
  CreateWorkflowPayload,
  UpdateWorkflowPayload,
  WorkflowVersion,
} from ".";

export interface WorkflowData {
  list: WorkflowResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pageCount: number;
  };
}

export interface WorkflowState {
  workflowData: WorkflowData;
  selectedWorkflow: WorkflowResponse | null;
  isLoading: boolean;
  error: Nullable<string>;
  success: Nullable<string>;
  hasInitialized: boolean;
  // Version history state
  versions: WorkflowVersion[];
  selectedVersion: WorkflowVersion | null;
  isLoadingVersions: boolean;
}

export interface WorkflowActions {
  loadWorkflowList: (params?: Partial<WorkflowQueryParams>) => Promise<WorkflowData>;
  loadWorkflowDetail: (id: number) => Promise<void>;
  createWorkflow: (payload: CreateWorkflowPayload) => Promise<WorkflowResponse>;
  updateWorkflow: (id: number, payload: UpdateWorkflowPayload) => Promise<WorkflowResponse>;
  deleteWorkflow: (id: number) => Promise<void>;
  loadVersions: (workflowId: number) => Promise<void>;
  loadVersion: (workflowId: number, version: number) => Promise<void>;
  rollback: (workflowId: number, targetVersion: number) => Promise<void>;
  reset: () => void;
}

export type WorkflowStore = WorkflowState & WorkflowActions;
