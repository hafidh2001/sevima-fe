import { create } from "zustand";
import { workflowApi } from "@/services/workflowApi";
import type { WorkflowStore, WorkflowData } from "@/types/workflow/store";
import { DEFAULT_PAGE_SIZE } from "@/constants/table";
import { WorkflowStatusEnum } from "@/types";

const initialState = {
  workflowData: {
    list: [],
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      total: 0,
      pageCount: 1,
    },
  },
  selectedWorkflow: null,
  isLoading: false,
  error: null as string | null,
  success: null as string | null,
  hasInitialized: false,
};

export const useWorkflowStore = create<WorkflowStore>((set) => ({
  ...initialState,

  loadWorkflowList: async (params?: Partial<{
    page?: number;
    limit?: number;
    name?: string;
    status?: WorkflowStatusEnum;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    from?: string;
    to?: string;
  }>) => {
    set({ isLoading: true, error: null });

    try {
      const response = await workflowApi.getAll({
        page: params?.page ?? 1,
        limit: params?.limit ?? DEFAULT_PAGE_SIZE,
        name: params?.name,
        status: params?.status,
        sortBy: params?.sortBy ?? "createdAt",
        sortOrder: params?.sortOrder ?? "desc",
        from: params?.from,
        to: params?.to,
      });

      const workflowData: WorkflowData = {
        list: response.data,
        pagination: {
          page: response.meta.page,
          limit: response.meta.perPage,
          total: response.meta.total,
          pageCount: response.meta.totalPages,
        },
      };

      set({
        workflowData,
        isLoading: false,
        hasInitialized: true,
      });

      return workflowData;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to load workflow list",
        isLoading: false,
        hasInitialized: true,
      });
      throw error;
    }
  },

  loadWorkflowDetail: async (id: number) => {
    set({ isLoading: true, error: null, selectedWorkflow: null });

    try {
      const response = await workflowApi.getById(id);
      set({ selectedWorkflow: response, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to load workflow detail",
        isLoading: false,
      });
    }
  },

  reset: () => set(initialState),
}));
