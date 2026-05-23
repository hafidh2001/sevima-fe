import { Nullable } from "@/types";
import {
  WorkflowQueryParams,
  WorkflowResponse,
  CreateWorkflowPayload,
  UpdateWorkflowPayload,
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
}

export interface WorkflowActions {
  loadWorkflowList: (params?: Partial<WorkflowQueryParams>) => Promise<WorkflowData>;
  loadWorkflowDetail: (id: number) => Promise<void>;
  createWorkflow: (payload: CreateWorkflowPayload) => Promise<WorkflowResponse>;
  updateWorkflow: (id: number, payload: UpdateWorkflowPayload) => Promise<WorkflowResponse>;
  deleteWorkflow: (id: number) => Promise<void>;
  reset: () => void;
}

export type WorkflowStore = WorkflowState & WorkflowActions;
