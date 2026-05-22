import { create } from "zustand";
import { masterApi } from "@/services/masterApi";
import type { MasterStore } from "@/types/master/store";
import { BasicSelectOpt } from "@/types";

const initialState = {
  tenantOptions: [] as BasicSelectOpt<number>[],
  isLoadingTenantOptions: false,
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

  reset: () => {
    set(initialState);
  },
}));
