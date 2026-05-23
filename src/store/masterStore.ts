import { create } from "zustand";
import { masterApi } from "@/services/masterApi";
import type { MasterStore } from "@/types/master/store";
import { BasicSelectOpt, WorkflowStatusEnum, NodeTypeEnum } from "@/types";

const initialState = {
  tenantOptions: [] as BasicSelectOpt<number>[],
  isLoadingTenantOptions: false,
  workflowStatusOptions: [] as BasicSelectOpt<string>[],
  nodeTypeOptions: [] as BasicSelectOpt<string>[],
  error: null as string | null,
};

export const useMasterStore = create<MasterStore>((set) => ({
  ...initialState,

  fetchTenantOptions: async () => {
    set({ isLoadingTenantOptions: true, error: null });
    try {
      const response = await masterApi.getTenantOptions();
      const options: BasicSelectOpt<number>[] = response.map((item) => ({
        label: item.name,
        value: item.id,
      }));
      set({ tenantOptions: options, isLoadingTenantOptions: false });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Terjadi kesalahan";
      set({ error: message, isLoadingTenantOptions: false });
    }
  },
  fetchWorkflowStatusOptions: () => {
    const options: BasicSelectOpt<string>[] = Object.entries(
      WorkflowStatusEnum,
    ).map(([key, value]) => ({
      label: key,
      value,
    }));
    set({
      workflowStatusOptions: options,
    });
  },
  fetchNodeTypeOptions: () => {
    const options: BasicSelectOpt<string>[] = Object.entries(NodeTypeEnum).map(
      ([key, value]) => ({
        label: key.replace(/_/g, " "),
        value,
      }),
    );
    set({ nodeTypeOptions: options });
  },

  reset: () => {
    set(initialState);
  },
}));
