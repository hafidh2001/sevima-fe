import { useState, useCallback, useEffect } from "react";
import { PlusIcon, TrashIcon, ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/fields/inputField";
import { SingleSelect } from "@/components/fields/singleSelect";
import { useMasterStore } from "@/store/masterStore";
import type { WorkflowNode, WorkflowEdge, WorkflowDefinition } from "@/types/workflow";

interface WorkflowBuilderProps {
  definition: WorkflowDefinition;
  onChange: (definition: WorkflowDefinition) => void;
  errors?: {
    nodes?: string;
    edges?: string;
    general?: string;
  };
}

export const WorkflowBuilder = ({ definition, onChange, errors }: WorkflowBuilderProps) => {
  const [newNodeId, setNewNodeId] = useState("");
  const [newNodeType, setNewNodeType] = useState<string>("HTTP_CALL");
  const [newNodeName, setNewNodeName] = useState("");
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  const [newEdgeFrom, setNewEdgeFrom] = useState<string>("");
  const [newEdgeTo, setNewEdgeTo] = useState<string>("");

  const { nodeTypeOptions, fetchNodeTypeOptions } = useMasterStore();

  useEffect(() => {
    fetchNodeTypeOptions();
  }, [fetchNodeTypeOptions]);

  // Node handlers
  const handleAddNode = useCallback(() => {
    if (!newNodeId.trim() || !newNodeName.trim()) return;

    // Validate ID format (alphanumeric, underscore, hyphen only)
    if (!/^[a-zA-Z0-9_-]+$/.test(newNodeId)) {
      return;
    }

    // Check for duplicate ID
    if (definition.nodes.some((n) => n.id === newNodeId)) {
      return;
    }

    const newNode: WorkflowNode = {
      id: newNodeId.trim(),
      type: newNodeType,
      name: newNodeName.trim(),
      config: {},
    };

    onChange({
      ...definition,
      nodes: [...definition.nodes, newNode],
    });

    setNewNodeId("");
    setNewNodeName("");
  }, [newNodeId, newNodeType, newNodeName, definition, onChange]);

  const handleUpdateNode = useCallback((nodeId: string, updates: Partial<WorkflowNode>) => {
    onChange({
      ...definition,
      nodes: definition.nodes.map((n) =>
        n.id === nodeId ? { ...n, ...updates } : n
      ),
    });
  }, [definition, onChange]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    // Also remove any edges connected to this node
    const updatedEdges = definition.edges.filter(
      (e) => e.from !== nodeId && e.to !== nodeId
    );

    onChange({
      nodes: definition.nodes.filter((n) => n.id !== nodeId),
      edges: updatedEdges,
    });
  }, [definition, onChange]);

  // Edge handlers
  const handleAddEdge = useCallback(() => {
    if (!newEdgeFrom.trim() || !newEdgeTo.trim()) return;
    if (newEdgeFrom === newEdgeTo) return;

    // Check if edge already exists
    if (definition.edges.some((e) => e.from === newEdgeFrom && e.to === newEdgeTo)) {
      return;
    }

    // Check if nodes exist
    if (!definition.nodes.some((n) => n.id === newEdgeFrom)) return;
    if (!definition.nodes.some((n) => n.id === newEdgeTo)) return;

    const newEdge: WorkflowEdge = {
      from: newEdgeFrom.trim(),
      to: newEdgeTo.trim(),
    };

    onChange({
      ...definition,
      edges: [...definition.edges, newEdge],
    });

    setNewEdgeFrom("");
    setNewEdgeTo("");
  }, [newEdgeFrom, newEdgeTo, definition, onChange]);

  const handleDeleteEdge = useCallback((from: string, to: string) => {
    onChange({
      ...definition,
      edges: definition.edges.filter((e) => !(e.from === from && e.to === to)),
    });
  }, [definition, onChange]);

  const nodeIdOptions = definition.nodes.map((n) => ({ value: n.id, label: n.id }));

  // Get nodes that are already used as "from" in any edge (cannot be used as "from" again)
  const usedFromNodeIds = new Set(definition.edges.map((e) => e.from));
  // Get nodes that are already used as "to" in any edge (cannot be used as "to" again)
  const usedToNodeIds = new Set(definition.edges.map((e) => e.to));

  // From dropdown: exclude nodes that are already used as "from"
  const fromNodeOptions = nodeIdOptions.filter((n) => !usedFromNodeIds.has(n.value));
  // To dropdown: exclude nodes that are already used as "to" AND exclude the selected "from" node
  const toNodeOptions = nodeIdOptions.filter(
    (n) => !usedToNodeIds.has(n.value) && n.value !== newEdgeFrom
  );

  return (
    <div className="space-y-6">
      {/* Nodes Section */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Steps (Nodes)</h3>
        <p className="text-sm text-gray-500 mb-4">
          Tambahkan minimal 1 node. Node ID hanya boleh mengandung huruf, angka, underscore, dan hyphen.
        </p>

        {/* Add Node Form */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
          <InputField
            value={newNodeId}
            onChange={setNewNodeId}
            placeholder="Node ID (e.g., step1)"
            disabled={editingNodeId !== null}
          />
          <SingleSelect
            value={nodeTypeOptions.find((t) => t.value === newNodeType) || null}
            onChange={(opt) => setNewNodeType(opt?.value as string)}
            options={nodeTypeOptions}
            placeholder="Type"
            disabled={editingNodeId !== null}
            isClearable={false}
          />
          <InputField
            value={newNodeName}
            onChange={setNewNodeName}
            placeholder="Node Name"
            disabled={editingNodeId !== null}
          />
          <Button
            type="button"
            onClick={handleAddNode}
            disabled={!newNodeId.trim() || !newNodeName.trim() || editingNodeId !== null}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Node
          </Button>
        </div>

        {/* Node List */}
        {definition.nodes.length > 0 ? (
          <div className="space-y-2">
            {definition.nodes.map((node) => (
              <div
                key={node.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <span className="text-xs text-gray-500">ID:</span>
                    <p className="font-mono text-sm font-medium">{node.id}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Type:</span>
                    <p className="text-sm">{node.type}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Name:</span>
                    {editingNodeId === node.id ? (
                      <InputField
                        value={node.name}
                        onChange={(value) => handleUpdateNode(node.id, { name: value })}
                      />
                    ) : (
                      <p className="text-sm">{node.name}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setEditingNodeId(editingNodeId === node.id ? null : node.id)
                    }
                  >
                    {editingNodeId === node.id ? "Done" : "Edit"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteNode(node.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm py-4 text-center">
            No nodes added yet. Add at least one node to define your workflow steps.
          </p>
        )}

        {errors?.nodes && (
          <p className="text-sm text-red-600 mt-2">{errors.nodes}</p>
        )}
      </div>

      {/* Edges Section */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Connections (Edges)</h3>
        <p className="text-sm text-gray-500 mb-4">
          Hubungkan node untuk mendefinisikan alur workflow. Setiap node hanya bisa menjadi sumber koneksi satu kali.
        </p>

        {/* Add Edge Form */}
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <div className="flex-1">
              <SingleSelect
                value={nodeIdOptions.find((n) => n.value === newEdgeFrom) || null}
                onChange={(opt) => setNewEdgeFrom(opt?.value as string)}
                options={fromNodeOptions}
                placeholder="From Node"
                isSearchable
              />
            </div>
            <ArrowRightIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <div className="flex-1">
              <SingleSelect
                value={nodeIdOptions.find((n) => n.value === newEdgeTo) || null}
                onChange={(opt) => setNewEdgeTo(opt?.value as string)}
                options={toNodeOptions}
                placeholder="To Node"
                isSearchable
              />
            </div>
          </div>
          <Button
            type="button"
            onClick={handleAddEdge}
            disabled={!newEdgeFrom.trim() || !newEdgeTo.trim() || newEdgeFrom === newEdgeTo}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>

        {/* Edge List */}
        {definition.edges.length > 0 ? (
          <div className="space-y-2">
            {definition.edges.map((edge, idx) => (
              <div
                key={`${edge.from}-${edge.to}-${idx}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {edge.from}
                  </span>
                  <ArrowRightIcon className="h-4 w-4 text-gray-400" />
                  <span className="font-mono text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                    {edge.to}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteEdge(edge.from, edge.to)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm py-4 text-center">
            No connections added yet. Connect nodes to define the workflow flow.
          </p>
        )}

        {errors?.edges && (
          <p className="text-sm text-red-600 mt-2">{errors.edges}</p>
        )}
      </div>

      {errors?.general && (
        <p className="text-sm text-red-600">{errors.general}</p>
      )}
    </div>
  );
};

export default WorkflowBuilder;
