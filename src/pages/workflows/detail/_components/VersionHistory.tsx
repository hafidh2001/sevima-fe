import { useState, useEffect, useCallback } from "react";
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
import { WorkflowVersion, WorkflowNode, WorkflowEdge, StepStatusEnum } from "@/types/workflow";
import { showToast } from "@/utils/toast";
import { useAuthStore } from "@/store/authStore";
import { RoleEnum } from "@/types";
import { Button } from "@/components/ui/button";
import { ConfirmationModal } from "@/components/confirmationModal";
import {
  Clock,
  User,
  RotateCcw,
  Loader2,
  ChevronDown,
  ChevronRight,
  GitBranch,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { id } from "date-fns/locale";

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

function WorkflowNodeReadOnly({ data, id }: { data: NodeData; id: string }) {
  const colors = nodeTypeColors[data.type] || nodeTypeColors.default;

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        id={id}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
      <div
        className={`${colors.bg} ${colors.border} border-2 rounded-lg px-4 py-3 max-w-[200px] shadow-lg`}
      >
        <div className="text-xs uppercase tracking-wide opacity-80 mb-1">{data.type}</div>
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
  workflowNode: WorkflowNodeReadOnly,
};

const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;
const GAP_X = 100;
const GAP_Y = 120;
const NODES_PER_ROW = 3;

function getGridLayoutElements(nodes: Node[], edges: Edge[]) {
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

function convertToFlowNodes(nodes: WorkflowNode[], edges: WorkflowEdge[]): { flowNodes: Node[]; flowEdges: Edge[] } {
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

interface VersionHistoryProps {
  workflowId: number;
  currentVersion: number;
  onRollbackComplete: () => void;
}

function VersionCard({
  version,
  workflowId,
  isExpanded,
  onToggle,
  onRollback,
  isRollingBack,
  isLatest,
  currentVersion,
  canRollback,
}: {
  version: WorkflowVersion;
  workflowId: number;
  isExpanded: boolean;
  onToggle: () => void;
  onRollback: () => void;
  isRollingBack: boolean;
  isLatest: boolean;
  currentVersion: number;
  canRollback: boolean;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isLoadingDefinition, setIsLoadingDefinition] = useState(false);

  useEffect(() => {
    if (isExpanded && nodes.length === 0) {
      loadDefinition();
    }
  }, [isExpanded, version.version]);

  const loadDefinition = async () => {
    setIsLoadingDefinition(true);
    try {
      const fullVersion = await workflowApi.getVersion(workflowId, version.version);
      if (fullVersion.definition) {
        const { flowNodes, flowEdges } = convertToFlowNodes(
          fullVersion.definition.nodes || [],
          fullVersion.definition.edges || []
        );
        setNodes(flowNodes);
        setEdges(flowEdges);
      }
    } catch (error) {
      console.error("Failed to load version definition:", error);
    } finally {
      setIsLoadingDefinition(false);
    }
  };

  const nodeCount = version.definition?.nodes?.length || 0;
  const edgeCount = version.definition?.edges?.length || 0;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold">
            v{version.version}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-gray-900 dark:text-gray-100">
                Version {version.version}
                {isLatest && (
                  <span className="ml-2 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">
                    Latest
                  </span>
                )}
                {version.version === currentVersion && (
                  <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                    Current
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(version.createdAt), {
                  addSuffix: true,
                  locale: id,
                })}
              </span>
              <span>•</span>
              <span>
                {format(new Date(version.createdAt), "dd MMM yyyy HH:mm", { locale: id })}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {nodeCount} steps • {edgeCount} connections
          </span>
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
          {isLoadingDefinition ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              {/* DAG Preview */}
              {nodes.length > 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <GitBranch className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      DAG Preview (Read-only)
                    </span>
                  </div>
                  <div className="h-[200px]">
                    <ReactFlow
                      nodes={nodes}
                      edges={edges}
                      onNodesChange={onNodesChange}
                      onEdgesChange={onEdgesChange}
                      nodeTypes={nodeTypes}
                      fitView
                      fitViewOptions={{ padding: 0.3 }}
                      minZoom={0.3}
                      maxZoom={1}
                      attributionPosition="bottom-left"
                    >
                      <Controls />
                      <Background />
                    </ReactFlow>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4 text-center text-gray-500 dark:text-gray-400">
                  No DAG definition for this version
                </div>
              )}

              {/* Rollback Button */}
              {!isLatest && canRollback && (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRollback();
                    }}
                    disabled={isRollingBack}
                    className="flex items-center gap-2"
                  >
                    {isRollingBack ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Rolling back...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="h-4 w-4" />
                        Rollback to this version
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function VersionHistory({
  workflowId,
  currentVersion,
  onRollbackComplete,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<WorkflowVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null);
  const [rollingBackVersion, setRollingBackVersion] = useState<number | null>(null);
  const [showRollbackConfirm, setShowRollbackConfirm] = useState(false);
  const [versionToRollback, setVersionToRollback] = useState<number | null>(null);

  const { user } = useAuthStore();
  const canRollback = user?.role === RoleEnum.ADMIN;

  const fetchVersions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await workflowApi.getVersions(workflowId);
      setVersions(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load versions";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [workflowId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const handleRollbackClick = (version: number) => {
    setVersionToRollback(version);
    setShowRollbackConfirm(true);
  };

  const handleConfirmRollback = async () => {
    if (versionToRollback === null) return;

    setRollingBackVersion(versionToRollback);
    setShowRollbackConfirm(false);

    try {
      const result = await workflowApi.rollback(workflowId, versionToRollback);
      showToast(result.message, "success");
      await fetchVersions();
      onRollbackComplete();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to rollback";
      showToast(message, "error");
    } finally {
      setRollingBackVersion(null);
      setVersionToRollback(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <Button variant="outline" onClick={fetchVersions}>
          Try Again
        </Button>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <GitBranch className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
        <p>No version history available</p>
      </div>
    );
  }

  const latestVersion = versions[0]?.version;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Version History ({versions.length} versions)
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <User className="h-4 w-4" />
          <span>Author information will be shown here</span>
        </div>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {versions.map((version) => (
          <VersionCard
            key={version.id}
            version={version}
            workflowId={workflowId}
            isExpanded={expandedVersion === version.version}
            onToggle={() =>
              setExpandedVersion(expandedVersion === version.version ? null : version.version)
            }
            onRollback={() => handleRollbackClick(version.version)}
            isRollingBack={rollingBackVersion === version.version}
            isLatest={version.version === latestVersion}
            currentVersion={currentVersion}
            canRollback={canRollback}
          />
        ))}
      </div>

      {/* Rollback Confirmation Modal */}
      <ConfirmationModal
        isShown={showRollbackConfirm}
        toggle={(open) => {
          if (open === false) setShowRollbackConfirm(false);
        }}
        title="Rollback Workflow"
        description={`Are you sure you want to rollback to version ${versionToRollback}? This will create a new version with the definition from version ${versionToRollback}.`}
        onConfirm={handleConfirmRollback}
        onCancel={() => setShowRollbackConfirm(false)}
        confirmText="Yes, Rollback"
        cancelText="Cancel"
        confirmVariant="default"
        cancelVariant="outline"
      />
    </div>
  );
}
