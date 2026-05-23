import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Position,
  Handle,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { workflowApi } from "@/services/workflowApi";
import { workflowRunApi } from "@/services/workflowRunApi";
import {
  WorkflowResponse,
  WorkflowNode,
  WorkflowEdge,
  StepStatusEnum,
  RunStatusEnum,
  WorkflowRun,
  WorkflowRunQueryParams,
  StepRun,
} from "@/types/workflow";
import { sseService, getStepStatusColor } from "@/services/sseService";
import { Button } from "@/components/ui/button";
import { showToast } from "@/utils/toast";
import { ROUTES } from "@/utils/routes";
import { formatDistanceToNow, format } from "date-fns";
import { id } from "date-fns/locale";
import {
  ArrowLeft,
  Pencil,
  Play,
  Loader2,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Ban,
  RotateCcw,
} from "lucide-react";

type NodeData = {
  label: string;
  type: string;
  config?: Record<string, unknown>;
  status?: StepStatusEnum;
};

const nodeTypeColors: Record<string, { bg: string; border: string; text: string }> = {
  START: { bg: "bg-green-500", border: "border-green-600", text: "text-white" },
  END: { bg: "bg-red-500", border: "border-red-600", text: "text-white" },
  HTTP_CALL: { bg: "bg-blue-500", border: "border-blue-600", text: "text-white" },
  SCRIPT: { bg: "bg-purple-500", border: "border-purple-600", text: "text-white" },
  DELAY: { bg: "bg-yellow-500", border: "border-yellow-600", text: "text-white" },
  CONDITION: { bg: "bg-orange-500", border: "border-orange-600", text: "text-white" },
  default: { bg: "bg-gray-500", border: "border-gray-600", text: "text-white" },
};

interface WorkflowNodeComponentProps {
  data: NodeData;
  id: string;
}

function WorkflowNodeComponent({ data, id }: WorkflowNodeComponentProps) {
  const colors = nodeTypeColors[data.type] || nodeTypeColors.default;
  const statusColor = data.status ? getStepStatusColor(data.status) : undefined;

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        id={id}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
      <div
        className={`${colors.bg} ${colors.border} border-2 rounded-lg px-4 py-3 max-w-[200px] shadow-lg relative`}
        style={
          statusColor
            ? {
                boxShadow: `0 0 0 3px ${statusColor}`,
              }
            : undefined
        }
      >
        <div className="text-xs uppercase tracking-wide opacity-80 mb-1">
          {data.type}
          {data.status && (
            <span
              className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/20"
            >
              {data.status}
            </span>
          )}
        </div>
        <div className={`font-semibold ${colors.text} break-words`}>{data.label}</div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id={id}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
    </>
  );
}

const nodeTypes = {
  workflowNode: WorkflowNodeComponent,
};

// Node dimensions - fixed width for consistent grid layout
const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;
const GAP_X = 100;
const GAP_Y = 120;
const NODES_PER_ROW = 3;

function getGridLayoutElements(
  nodes: Node[],
  edges: Edge[]
): { layoutedNodes: Node[]; layoutedEdges: Edge[] } {
  if (nodes.length === 0) {
    return { layoutedNodes: [], layoutedEdges: edges };
  }

  const layoutedNodes = nodes.map((node, index) => {
    const row = Math.floor(index / NODES_PER_ROW);
    const indexInRow = index % NODES_PER_ROW;
    const x = indexInRow * (NODE_WIDTH + GAP_X);
    const y = row * (NODE_HEIGHT + GAP_Y);

    return {
      ...node,
      position: { x, y },
    };
  });

  return { layoutedNodes, layoutedEdges: edges };
}

function convertToFlowNodes(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  stepStatuses?: Map<string, StepStatusEnum>
): { flowNodes: Node[]; flowEdges: Edge[] } {
  if (!nodes.length) {
    return { flowNodes: [], flowEdges: [] };
  }

  const flowNodes: Node[] = nodes.map((node) => ({
    id: node.id,
    type: "workflowNode",
    position: { x: 0, y: 0 },
    data: {
      label: node.name,
      type: node.type,
      config: node.config,
      status: stepStatuses?.get(node.id) || StepStatusEnum.PENDING,
    } as NodeData,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  }));

  const flowEdges: Edge[] = edges.map((edge, index) => ({
    id: `edge-${edge.from}-${edge.to}-${index}`,
    source: edge.from,
    target: edge.to,
    sourceHandleId: edge.from,
    targetHandleId: edge.to,
    type: "smoothstep",
    animated: false,
    style: {
      stroke: "#3b82f6",
      strokeWidth: 2,
    },
  }));

  const { layoutedNodes, layoutedEdges } = getGridLayoutElements(flowNodes, flowEdges);

  return { flowNodes: layoutedNodes, flowEdges: layoutedEdges };
}

// Run History Component
function RunHistoryItem({
  run,
  isExpanded,
  onToggle,
  onCancel,
  onRetry,
  workflowId,
}: {
  run: WorkflowRun;
  isExpanded: boolean;
  onToggle: () => void;
  onCancel: () => void;
  onRetry: () => void;
  workflowId: number;
}) {
  const [stepRuns, setStepRuns] = useState<StepRun[]>([]);
  const [isLoadingSteps, setIsLoadingSteps] = useState(false);

  useEffect(() => {
    if (isExpanded && !run.stepRuns) {
      loadStepRuns();
    } else if (run.stepRuns) {
      setStepRuns(run.stepRuns);
    }
  }, [isExpanded, run]);

  const loadStepRuns = async () => {
    setIsLoadingSteps(true);
    try {
      const data = await workflowRunApi.getById(workflowId, run.id);
      setStepRuns(data.stepRuns || []);
    } catch (error) {
      console.error("Failed to load step runs:", error);
    } finally {
      setIsLoadingSteps(false);
    }
  };

  const getStatusIcon = (status: RunStatusEnum) => {
    switch (status) {
      case RunStatusEnum.SUCCESS:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case RunStatusEnum.FAILED:
        return <XCircle className="h-4 w-4 text-red-500" />;
      case RunStatusEnum.RUNNING:
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case RunStatusEnum.PENDING:
        return <Clock className="h-4 w-4 text-gray-400" />;
      case RunStatusEnum.CANCELLED:
        return <Ban className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStepStatusIcon = (status: StepStatusEnum) => {
    switch (status) {
      case StepStatusEnum.SUCCESS:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case StepStatusEnum.FAILED:
        return <XCircle className="h-4 w-4 text-red-500" />;
      case StepStatusEnum.RUNNING:
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case StepStatusEnum.PENDING:
        return <Clock className="h-4 w-4 text-gray-400" />;
      case StepStatusEnum.SKIPPED:
        return <Ban className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const formatDuration = (start: string | null, end: string | null) => {
    if (!start) return "-";
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();
    const diff = endDate.getTime() - startDate.getTime();
    if (diff < 1000) return "< 1s";
    if (diff < 60000) return `${Math.floor(diff / 1000)}s`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ${Math.floor((diff % 60000) / 1000)}s`;
    return `${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m`;
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          {getStatusIcon(run.status)}
          <div>
            <p className="font-medium text-gray-900">
              Run #{run.id}
              <span className="ml-2 text-sm text-gray-500">
                {formatDistanceToNow(new Date(run.createdAt), { addSuffix: true, locale: id })}
              </span>
            </p>
            <p className="text-sm text-gray-500">
              {format(new Date(run.createdAt), "dd MMM yyyy HH:mm:ss", { locale: id })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              run.status === RunStatusEnum.SUCCESS
                ? "bg-green-100 text-green-700"
                : run.status === RunStatusEnum.FAILED
                ? "bg-red-100 text-red-700"
                : run.status === RunStatusEnum.RUNNING
                ? "bg-blue-100 text-blue-700"
                : run.status === RunStatusEnum.CANCELLED
                ? "bg-gray-100 text-gray-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {run.status}
          </span>
          <span className="text-sm text-gray-500">
            <Clock className="h-4 w-4 inline mr-1" />
            {formatDuration(run.startedAt, run.completedAt)}
          </span>
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          {isLoadingSteps ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : stepRuns.length > 0 ? (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700 mb-3">Step Details</h4>
              {stepRuns.map((step) => (
                <div
                  key={step.id}
                  className="bg-white border border-gray-200 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStepStatusIcon(step.status)}
                      <div>
                        <p className="font-medium text-gray-900">{step.stepName}</p>
                        <p className="text-xs text-gray-500 uppercase">{step.stepType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          step.status === StepStatusEnum.SUCCESS
                            ? "bg-green-100 text-green-700"
                            : step.status === StepStatusEnum.FAILED
                            ? "bg-red-100 text-red-700"
                            : step.status === StepStatusEnum.RUNNING
                            ? "bg-blue-100 text-blue-700"
                            : step.status === StepStatusEnum.SKIPPED
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {step.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDuration(step.startedAt, step.completedAt)}
                      </span>
                      {step.retryCount > 0 && (
                        <span className="text-xs text-orange-500">
                          Retry #{step.retryCount}
                        </span>
                      )}
                    </div>
                  </div>
                  {step.error && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                      {step.error}
                    </div>
                  )}
                  {step.output && (
                    <div className="mt-2 p-2 bg-gray-100 border border-gray-200 rounded text-xs font-mono overflow-x-auto">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(step.output, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Tidak ada detail step</p>
          )}

          {run.status === RunStatusEnum.FAILED && (
            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onRetry();
                }}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </div>
          )}

          {run.status === RunStatusEnum.RUNNING && (
            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel();
                }}
              >
                <Ban className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function WorkflowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
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
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-600">Workflow tidak ditemukan</p>
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
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{workflow.name}</h1>
            {workflow.description && (
              <p className="text-gray-500 mt-1">{workflow.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
              <span>Versi {workflow.latestVersion?.version || "-"}</span>
              <span>•</span>
              <span>{workflow._count.runs} run</span>
              <span>•</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  workflow.status === "ACTIVE"
                    ? "bg-green-100 text-green-700"
                    : workflow.status === "DRAFT"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {workflow.status}
              </span>
            </div>
          </div>

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
        </div>
      </div>

      {/* DAG Visualization */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-800">Diagram Workflow</h2>
              <p className="text-sm text-gray-500 mt-1">
                {hasDefinition
                  ? `${workflow.latestVersion?.definition.nodes.length} step • ${workflow.latestVersion?.definition.edges.length} koneksi`
                  : "Tidak ada definisi step"}
              </p>
            </div>
            {activeRunId && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Run #{activeRunId} sedang berjalan
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1 text-xs">
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>Running</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Success</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>Failed</span>
            </div>
          </div>
        </div>

        {hasDefinition ? (
          <div className="h-[400px]">
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
            >
              <Controls />
              <Background />
            </ReactFlow>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-400">
            <p>Belum ada definisi workflow</p>
          </div>
        )}
      </div>

      {/* Run History */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="font-semibold text-gray-800">Riwayat Run</h2>
          <p className="text-sm text-gray-500 mt-1">
            {runsMeta?.total || 0} total run
          </p>
        </div>

        <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
          {isLoadingRuns && runs.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : runs.length > 0 ? (
            <>
              {runs.map((run) => (
                <RunHistoryItem
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
            <div className="text-center py-8 text-gray-500">
              <p>Belum ada riwayat run</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
