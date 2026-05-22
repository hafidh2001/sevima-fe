import { BasicSelectOpt, Nullable } from "@/types";

export interface MasterState {
  tenantOptions: BasicSelectOpt<number>[];
  isLoadingTenantOptions: boolean;
  error: Nullable<string>;
}

export interface MasterActions {
  fetchTenantOptions: () => Promise<void>;
  reset: () => void;
}

export type MasterStore = MasterState & MasterActions;
