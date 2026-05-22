import { BasicSelectOpt, Nullable } from "@/types";

export type WorkflowStatusOption = "all" | "active" | "draft" | "archived";

export interface MasterState {
  tenantOptions: BasicSelectOpt<number>[];
  isLoadingTenantOptions: boolean;
  workflowStatusOptions: BasicSelectOpt<string>[];
  isLoadingWorkflowStatusOptions: boolean;
  error: Nullable<string>;
}

export interface MasterActions {
  fetchTenantOptions: () => Promise<void>;
  fetchWorkflowStatusOptions: () => void;
  reset: () => void;
}

export type MasterStore = MasterState & MasterActions;
