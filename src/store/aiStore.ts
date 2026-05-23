import { create } from "zustand";
import { aiApi } from "@/services/aiApi";
import { workflowApi } from "@/services/workflowApi";
import type { AIStore, AIGeneratedWorkflow } from "@/types/ai/store";
import type { CreateWorkflowPayload } from "@/types/workflow";

const initialState = {
  generatedWorkflow: null,
  isGenerating: false,
  isSaving: false,
  error: null as string | null,
};

export const useAIStore = create<AIStore>((set) => ({
  ...initialState,

  generateWorkflow: async (description: string) => {
    set({ isGenerating: true, error: null });

    try {
      const response = await aiApi.generateWorkflow(description);

      if (response.success && response.data) {
        const generatedWorkflow: AIGeneratedWorkflow = {
          name: response.data.name,
          description: response.data.description,
          definition: response.data.definition,
        };
        set({ generatedWorkflow, isGenerating: false });
        return generatedWorkflow;
      }

      throw new Error("Gagal menghasilkan workflow");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan";
      set({ error: message, isGenerating: false });
      throw error;
    }
  },

  saveWorkflow: async (workflow: AIGeneratedWorkflow) => {
    set({ isSaving: true, error: null });

    try {
      const sanitizedDefinition = {
        nodes: workflow.definition.nodes.map((node) => ({
          id: node.id,
          type: node.type,
          name: node.name,
          config: node.config || {},
        })),
        edges: workflow.definition.edges.map((edge) => ({
          from: edge.from,
          to: edge.to,
        })),
      };

      const payload: CreateWorkflowPayload = {
        name: workflow.name,
        description: workflow.description,
        definition: sanitizedDefinition,
      };

      await workflowApi.create(payload);
      set({ isSaving: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menyimpan workflow";
      set({ error: message, isSaving: false });
      throw error;
    }
  },

  reset: () => set(initialState),
}));