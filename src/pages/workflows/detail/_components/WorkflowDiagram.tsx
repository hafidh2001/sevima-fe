import { Node, Edge, Position, Handle } from "@xyflow/react";

import { WorkflowNode, WorkflowEdge, StepStatusEnum } from "@/types/workflow";
import { getStepStatusColor } from "@/services/sseService";
import {
  NODE_WIDTH,
  NODE_HEIGHT,
  GAP_X,
  GAP_Y,
  NODES_PER_ROW,
} from "@/constants/workflowDiagram";

type NodeData = {
  label: string;
  type: string;
  config?: Record<string, unknown>;
  status?: StepStatusEnum;
};

export const nodeTypeColors: Record<string, { bg: string; border: string; text: string }> = {
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

export function WorkflowNodeComponent({ data, id }: WorkflowNodeComponentProps) {
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

export const nodeTypes = {
  workflowNode: WorkflowNodeComponent,
};

export function getGridLayoutElements(
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

export function convertToFlowNodes(
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
