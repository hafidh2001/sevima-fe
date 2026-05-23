import type { WorkflowDefinition } from "@/types/workflow";

export interface AIGeneratedWorkflow {
  name: string;
  description: string;
  definition: WorkflowDefinition;
}

export interface AIStore {
  generatedWorkflow: AIGeneratedWorkflow | null;
  isGenerating: boolean;
  isSaving: boolean;
  error: string | null;
  generateWorkflow: (description: string) => Promise<AIGeneratedWorkflow | null>;
  saveWorkflow: (workflow: AIGeneratedWorkflow) => Promise<void>;
  reset: () => void;
}