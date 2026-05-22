import { Nullable } from "@/types";
import { WorkflowQueryParams, WorkflowResponse } from ".";

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
  reset: () => void;
}

export type WorkflowStore = WorkflowState & WorkflowActions;
