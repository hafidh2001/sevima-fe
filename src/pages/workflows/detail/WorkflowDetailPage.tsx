import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ReactFlow, Node, Edge, Controls, Background, useNodesState, useEdgesState } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { workflowApi } from "@/services/workflowApi";
import { workflowRunApi } from "@/services/workflowRunApi";
import {
  WorkflowResponse,
  StepStatusEnum,
  RunStatusEnum,
  WorkflowRun,
  WorkflowRunQueryParams,
} from "@/types/workflow";
import { sseService } from "@/services/sseService";
import { useAuthStore } from "@/store/authStore";
import { VersionHistory } from "./_components/VersionHistory";
import { WorkflowRunItem } from "./_components/WorkflowRunItem";
import { nodeTypes, convertToFlowNodes } from "./_components/WorkflowDiagram";
import { Button } from "@/components/ui/button";
import { showToast } from "@/utils/toast";
import { ROUTES } from "@/utils/routes";
import { RoleEnum } from "@/types";
import { Loader2, ArrowLeft, Pencil, Play, Clock, GitBranch, History } from "lucide-react";

export default function WorkflowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const canEdit = user?.role === RoleEnum.ADMIN || user?.role === RoleEnum.EDITOR;

  const [workflow, setWorkflow] = useState<WorkflowResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [runsMeta, setRunsMeta] = useState<{ total: number; page: number; totalPages: number } | null>(null);
  const [isLoadingRuns, setIsLoadingRuns] = useState(false);
  const [expandedRunId, setExpandedRunId] = useState<number | null>(null);

  const [stepStatuses, setStepStatuses] = useState<Map<string, StepStatusEnum>>(new Map());
  const [activeRunId, setActiveRunId] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<"diagram" | "history" | "versions">("diagram");

  const unsubscribeRef = useRef<(() => void) | null>(null);

  const fetchWorkflow = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await workflowApi.getById(Number(id));
      setWorkflow(data);

      if (data.latestVersion?.definition) {
        const { flowNodes, flowEdges } = convertToFlowNodes(
          data.latestVersion.definition.nodes,
          data.latestVersion.definition.edges,
          stepStatuses
        );
        setNodes(flowNodes);
        setEdges(flowEdges);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat detail workflow";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [id, setNodes, setEdges, stepStatuses]);

  const fetchRuns = useCallback(
    async (page = 1) => {
      if (!id) return;
      setIsLoadingRuns(true);
      try {
        const params: WorkflowRunQueryParams = {
          page,
          limit: 10,
          sortOrder: "desc",
        };
        const response = await workflowRunApi.getAll(Number(id), params);
        if (page === 1) {
          setRuns(response.data);
        } else {
          setRuns((prev) => [...prev, ...response.data]);
        }
        setRunsMeta({
          total: response.meta.total,
          page: response.meta.page,
          totalPages: response.meta.totalPages,
        });
      } catch (err) {
        console.error("Failed to fetch runs:", err);
      } finally {
        setIsLoadingRuns(false);
      }
    },
    [id]
  );

  // Subscribe to SSE for real-time updates
  const subscribeToRun = useCallback(
    (runId: number) => {
      // Unsubscribe from previous run
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

      setActiveRunId(runId);

      const unsubscribe = sseService.subscribeToRun(runId, {
        onStepUpdate: (event) => {
          setStepStatuses((prev) => {
            const newMap = new Map(prev);
            newMap.set(event.stepId, event.status);
            return newMap;
          });

          // Update node status in flow
          setNodes((nds) =>
            nds.map((node) => {
              if (node.id === event.stepId) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    status: event.status,
                  },
                };
              }
              return node;
            })
          );
        },
        onRunUpdate: (event) => {
          if (event.status === RunStatusEnum.SUCCESS || event.status === RunStatusEnum.FAILED) {
            setIsRunning(false);
            setActiveRunId(null);
            // Refresh runs list
            fetchRuns(1);
            // Unsubscribe when run completes
            if (unsubscribeRef.current) {
              unsubscribeRef.current();
              unsubscribeRef.current = null;
            }
          }
        },
        onError: (error) => {
          console.error("SSE error:", error);
          showToast("Koneksi real-time terputus", "error");
        },
        onConnect: () => {
          console.log("SSE connected");
        },
        onDisconnect: () => {
          console.log("SSE disconnected");
        },
      });

      unsubscribeRef.current = unsubscribe;
    },
    [fetchRuns, setNodes]
  );

  const handleTriggerRun = async () => {
    if (!id) return;
    setIsRunning(true);
    try {
      const run = await workflowRunApi.trigger(Number(id));
      showToast("Workflow dimulai", "success");
      subscribeToRun(run.id);
      fetchRuns(1);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menjalankan workflow";
      showToast(message, "error");
      setIsRunning(false);
    }
  };

  const handleCancelRun = async (runId: number) => {
    if (!id) return;
    try {
      await workflowRunApi.cancel(Number(id), runId);
      showToast("Workflow dibatalkan", "success");
      fetchRuns(1);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal membatalkan workflow";
      showToast(message, "error");
    }
  };

  const handleRetryRun = async (runId: number) => {
    if (!id) return;
    setIsRunning(true);
    try {
      const run = await workflowRunApi.retry(Number(id), runId);
      showToast("Workflow dijalankan ulang", "success");
      subscribeToRun(run.id);
      fetchRuns(1);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menjalankan ulang workflow";
      showToast(message, "error");
      setIsRunning(false);
    }
  };

  useEffect(() => {
    fetchWorkflow();
    fetchRuns(1);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [fetchWorkflow, fetchRuns]);

  // Update flow nodes when step statuses change
  useEffect(() => {
    if (workflow?.latestVersion?.definition) {
      const { flowNodes, flowEdges } = convertToFlowNodes(
        workflow.latestVersion.definition.nodes,
        workflow.latestVersion.definition.edges,
        stepStatuses
      );
      setNodes(flowNodes);
      setEdges(flowEdges);
    }
  }, [stepStatuses, workflow, setNodes, setEdges]);

  const hasDefinition = useMemo(
    () => Boolean(workflow?.latestVersion?.definition?.nodes?.length),
    [workflow]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
        <Button variant="outline" onClick={() => navigate(ROUTES.workflowList)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Daftar
        </Button>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <p className="text-yellow-600 dark:text-yellow-400">Workflow tidak ditemukan</p>
        </div>
        <Button variant="outline" onClick={() => navigate(ROUTES.workflowList)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Daftar
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(ROUTES.workflowList)}
          className="mb-4 text-gray-700 dark:text-gray-300"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{workflow.name}</h1>
            {workflow.description && (
              <p className="text-gray-500 dark:text-gray-400 mt-1">{workflow.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
              <span>Versi {workflow.latestVersion?.version || "-"}</span>
              <span>•</span>
              <span>{workflow._count.runs} run</span>
              <span>•</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  workflow.status === "ACTIVE"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                    : workflow.status === "DRAFT"
                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                {workflow.status}
              </span>
            </div>
          </div>

          {canEdit && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(ROUTES.workflowEdit.replace(":id", String(workflow.id)))}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleTriggerRun}
                disabled={isRunning || !hasDefinition}
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menjalankan...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Jalankan
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("diagram")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "diagram"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            <GitBranch className="h-4 w-4" />
            Diagram
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "history"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            <History className="h-4 w-4" />
            Run History
            {runsMeta && runsMeta.total > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs">
                {runsMeta.total}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("versions")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "versions"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            <Clock className="h-4 w-4" />
            Versions
            <span className="ml-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs">
              {workflow.versionCount}
            </span>
          </button>
        </div>

        <div className="p-4">
          {/* Diagram Tab */}
          {activeTab === "diagram" && (
            <>
              {activeRunId && (
                <div className="flex items-center gap-2 mb-4 text-sm text-blue-600 dark:text-blue-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Run #{activeRunId} sedang berjalan
                </div>
              )}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                  <span>Pending</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>Running</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Success</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span>Failed</span>
                </div>
              </div>
              {hasDefinition ? (
                <div className="h-[400px] bg-gray-50 dark:bg-gray-800 rounded-lg p-1">
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    nodeTypes={nodeTypes}
                    fitView
                    fitViewOptions={{ padding: 0.3 }}
                    minZoom={0.3}
                    maxZoom={2}
                    attributionPosition="bottom-left"
                    className="dark"
                  >
                    <Controls />
                    <Background className="dark" />
                  </ReactFlow>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">
                  <p>Belum ada definisi workflow</p>
                </div>
              )}
            </>
          )}

          {/* Run History Tab */}
          {activeTab === "history" && (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {runsMeta?.total || 0} total run
              </p>
              {isLoadingRuns && runs.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                </div>
              ) : runs.length > 0 ? (
                <>
                  {runs.map((run) => (
                    <WorkflowRunItem
                      key={run.id}
                      run={run}
                      isExpanded={expandedRunId === run.id}
                      onToggle={() =>
                        setExpandedRunId(expandedRunId === run.id ? null : run.id)
                      }
                      onCancel={() => handleCancelRun(run.id)}
                      onRetry={() => handleRetryRun(run.id)}
                      workflowId={workflow.id}
                    />
                  ))}

                  {runsMeta && runsMeta.page < runsMeta.totalPages && (
                    <div className="flex justify-center pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchRuns(runsMeta.page + 1)}
                        disabled={isLoadingRuns}
                      >
                        {isLoadingRuns ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Memuat...
                          </>
                        ) : (
                          "Muat lebih banyak"
                        )}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>Belum ada riwayat run</p>
                </div>
              )}
            </div>
          )}

          {/* Versions Tab */}
          {activeTab === "versions" && (
            <VersionHistory
              workflowId={workflow.id}
              currentVersion={workflow.latestVersion?.version || 0}
              onRollbackComplete={fetchWorkflow}
            />
          )}
        </div>
      </div>
    </div>
  );
}
