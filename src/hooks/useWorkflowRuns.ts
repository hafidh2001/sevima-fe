import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { workflowRunApi } from "@/services/workflowRunApi";
import type { WorkflowRunQueryParams, WorkflowRun, TriggerWorkflowPayload } from "@/types/workflow";
import { RunStatusEnum } from "@/types/workflow";

export const WORKFLOW_RUNS_KEY = (workflowId: number) => ["workflows", workflowId, "runs"] as const;
export const GLOBAL_RUN_STATS_KEY = ["runs", "stats"] as const;

export function useWorkflowRuns(workflowId: number, params?: WorkflowRunQueryParams) {
  return useQuery({
    queryKey: [...WORKFLOW_RUNS_KEY(workflowId), params],
    queryFn: () => workflowRunApi.getAll(workflowId, params),
    enabled: !!workflowId,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 10,
  });
}

export function useWorkflowRunStats(workflowId: number) {
  return useQuery({
    queryKey: ["workflows", workflowId, "runStats"],
    queryFn: () => workflowRunApi.getStats(workflowId),
    enabled: !!workflowId,
    staleTime: 1000 * 30,
  });
}

export function useGlobalRunStats() {
  return useQuery({
    queryKey: GLOBAL_RUN_STATS_KEY,
    queryFn: () => workflowRunApi.getGlobalStats(),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 30,
  });
}

export function useTriggerWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workflowId, payload }: { workflowId: number; payload?: TriggerWorkflowPayload }) =>
      workflowRunApi.trigger(workflowId, payload),

    onMutate: async ({ workflowId }) => {
      await queryClient.cancelQueries({ queryKey: WORKFLOW_RUNS_KEY(workflowId) });

      const previousRuns = queryClient.getQueryData<{ data: WorkflowRun[] }>(
        WORKFLOW_RUNS_KEY(workflowId)
      );

      const optimisticRun: WorkflowRun = {
        id: Date.now(),
        workflowDefinitionId: workflowId,
        workflowVersionId: 0,
        status: RunStatusEnum.PENDING,
        startedAt: null,
        completedAt: null,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<{ data: WorkflowRun[] }>(
        WORKFLOW_RUNS_KEY(workflowId),
        (old) => {
          if (!old) return { data: [optimisticRun] };
          return { data: [optimisticRun, ...old.data] };
        }
      );

      return { previousRuns };
    },

    onError: (_err, { workflowId }, context) => {
      if (context?.previousRuns) {
        queryClient.setQueryData(WORKFLOW_RUNS_KEY(workflowId), context.previousRuns);
      }
    },

    onSettled: (_data, _error, { workflowId }) => {
      queryClient.invalidateQueries({ queryKey: WORKFLOW_RUNS_KEY(workflowId) });
      queryClient.invalidateQueries({ queryKey: GLOBAL_RUN_STATS_KEY });
    },
  });
}

export function useCancelWorkflowRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workflowId, runId }: { workflowId: number; runId: number }) =>
      workflowRunApi.cancel(workflowId, runId),
    onSuccess: (_data, { workflowId }) => {
      queryClient.invalidateQueries({ queryKey: WORKFLOW_RUNS_KEY(workflowId) });
    },
  });
}

export function useRetryWorkflowRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workflowId, runId }: { workflowId: number; runId: number }) =>
      workflowRunApi.retry(workflowId, runId),
    onSuccess: (_data, { workflowId }) => {
      queryClient.invalidateQueries({ queryKey: WORKFLOW_RUNS_KEY(workflowId) });
    },
  });
}
