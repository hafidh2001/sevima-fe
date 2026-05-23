import { useEffect, useState, useCallback, useMemo } from "react";
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
import { WorkflowResponse, WorkflowNode, WorkflowEdge } from "@/types/workflow";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Play, Loader2 } from "lucide-react";
import { ROUTES } from "@/utils/routes";

type NodeData = {
  label: string;
  type: string;
  config?: Record<string, unknown>;
};

const nodeTypeColors: Record<string, { bg: string; border: string; text: string }> = {
  http: { bg: "bg-blue-500", border: "border-blue-600", text: "text-white" },
  script: { bg: "bg-purple-500", border: "border-purple-600", text: "text-white" },
  delay: { bg: "bg-yellow-500", border: "border-yellow-600", text: "text-white" },
  condition: { bg: "bg-orange-500", border: "border-orange-600", text: "text-white" },
  default: { bg: "bg-gray-500", border: "border-gray-600", text: "text-white" },
};

interface WorkflowNodeComponentProps {
  data: NodeData;
  id: string;
}

function WorkflowNodeComponent({ data, id }: WorkflowNodeComponentProps) {
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
        <div className="text-xs uppercase tracking-wide opacity-80 mb-1">
          {data.type}
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
const GAP_X = 100; // Horizontal gap between nodes
const GAP_Y = 120; // Vertical gap between rows
const NODES_PER_ROW = 3; // Fixed 3 nodes per row for clean grid

/**
 * Simple grid layout algorithm
 * All nodes flow left to right:
 * node 1 → node 2 → node 3
 * node 4 → node 5 → node 6
 */
function getGridLayoutElements(
  nodes: Node[],
  edges: Edge[]
): { layoutedNodes: Node[]; layoutedEdges: Edge[] } {
  if (nodes.length === 0) {
    return { layoutedNodes: [], layoutedEdges: edges };
  }

  // Assign nodes to positions in topological order
  const layoutedNodes = nodes.map((node, index) => {
    const row = Math.floor(index / NODES_PER_ROW);
    const indexInRow = index % NODES_PER_ROW;

    // All nodes flow left to right
    const x = indexInRow * (NODE_WIDTH + GAP_X);
    const y = row * (NODE_HEIGHT + GAP_Y);

    return {
      ...node,
      position: { x, y },
    };
  });

  return { layoutedNodes, layoutedEdges: edges };
}

function getLayoutedElements(
  nodes: Node[],
  edges: Edge[]
): { layoutedNodes: Node[]; layoutedEdges: Edge[] } {
  return getGridLayoutElements(nodes, edges);
}

function convertToFlowNodes(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
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
    animated: true,
    style: {
      stroke: "#3b82f6",
      strokeWidth: 2,
    },
  }));

  const { layoutedNodes, layoutedEdges } = getLayoutedElements(flowNodes, flowEdges);

  return { flowNodes: layoutedNodes, flowEdges: layoutedEdges };
}

export default function WorkflowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workflow, setWorkflow] = useState<WorkflowResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const fetchWorkflow = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await workflowApi.getById(Number(id));
      setWorkflow(data);

      // Convert workflow definition to flow nodes/edges
      if (data.latestVersion?.definition) {
        const { flowNodes, flowEdges } = convertToFlowNodes(
          data.latestVersion.definition.nodes,
          data.latestVersion.definition.edges
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
  }, [id, setNodes, setEdges]);

  useEffect(() => {
    fetchWorkflow();
  }, [fetchWorkflow]);

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
    <div className="p-6">
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
            <Button variant="default" size="sm">
              <Play className="h-4 w-4 mr-2" />
              Jalankan
            </Button>
          </div>
        </div>
      </div>

      {/* DAG Visualization */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="font-semibold text-gray-800">Diagram Workflow</h2>
          <p className="text-sm text-gray-500 mt-1">
            {hasDefinition
              ? `${workflow.latestVersion?.definition.nodes.length} step • ${workflow.latestVersion?.definition.edges.length} koneksi`
              : "Tidak ada definisi step"}
          </p>
        </div>

        {hasDefinition ? (
          <div className="h-[500px]">
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
    </div>
  );
}
