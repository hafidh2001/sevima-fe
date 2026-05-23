import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { workflowApi } from "@/services/workflowApi";
import type { WorkflowQueryParams, CreateWorkflowPayload, UpdateWorkflowPayload } from "@/types/workflow";

export const WORKFLOW_LIST_KEY = ["workflows", "list"] as const;
export const WORKFLOW_DETAIL_KEY = (id: number) => ["workflows", "detail", id] as const;

export function useWorkflows(params?: WorkflowQueryParams) {
  return useQuery({
    queryKey: [...WORKFLOW_LIST_KEY, params],
    queryFn: () => workflowApi.getAll(params),
    staleTime: 1000 * 60 * 2,
  });
}

export function useWorkflowDetail(id: number) {
  return useQuery({
    queryKey: WORKFLOW_DETAIL_KEY(id),
    queryFn: () => workflowApi.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateWorkflowPayload) => workflowApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKFLOW_LIST_KEY });
    },
  });
}

export function useUpdateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateWorkflowPayload }) =>
      workflowApi.update(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: WORKFLOW_LIST_KEY });
      queryClient.invalidateQueries({ queryKey: WORKFLOW_DETAIL_KEY(id) });
    },
  });
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => workflowApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKFLOW_LIST_KEY });
    },
  });
}
