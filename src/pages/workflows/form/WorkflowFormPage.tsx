import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { InputField } from "@/components/fields/inputField";
import { Button } from "@/components/ui/button";
import { TextareaField } from "@/components/fields/textareaField";
import { WorkflowBuilder } from "@/components/workflow/WorkflowBuilder";
import { useWorkflowStore } from "@/store/workflowStore";
import { ROUTES } from "@/utils/routes";
import { showToast } from "@/utils/toast";
import type { WorkflowDefinition } from "@/types/workflow";

const workflowSchema = z.object({
  name: z.string().min(1, "Nama workflow harus diisi").max(200, "Nama workflow maksimal 200 karakter"),
  description: z.string().max(500, "Deskripsi maksimal 500 karakter").optional(),
});

type WorkflowFormData = z.infer<typeof workflowSchema>;

const initialDefinition: WorkflowDefinition = {
  nodes: [],
  edges: [],
};

export const WorkflowFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const {
    selectedWorkflow,
    isLoading,
    success,
    loadWorkflowDetail,
    createWorkflow,
    updateWorkflow,
    reset,
  } = useWorkflowStore();

  const [definition, setDefinition] = useState<WorkflowDefinition>(initialDefinition);
  const [definitionErrors, setDefinitionErrors] = useState<{
    nodes?: string;
    edges?: string;
    general?: string;
  }>({});

  const {
    control,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
  } = useForm<WorkflowFormData>({
    resolver: zodResolver(workflowSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Load workflow detail when in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      loadWorkflowDetail(Number(id));
    }
    return () => {
      reset();
    };
  }, [isEditMode, id, loadWorkflowDetail, reset]);

  // Set form values and definition when selectedWorkflow is loaded in edit mode
  useEffect(() => {
    if (selectedWorkflow && isEditMode) {
      resetForm({
        name: selectedWorkflow.name,
        description: selectedWorkflow.description ?? "",
      });

      // Load definition from latest version if available
      if (selectedWorkflow.latestVersion?.definition) {
        setDefinition(selectedWorkflow.latestVersion.definition);
      } else {
        setDefinition(initialDefinition);
      }
    }
  }, [selectedWorkflow, isEditMode, resetForm]);

  // Validate definition
  const validateDefinition = (): boolean => {
    const newErrors: typeof definitionErrors = {};

    if (definition.nodes.length === 0) {
      newErrors.nodes = "Minimal satu step harus ditambahkan";
    }

    // Check that all edges reference existing nodes
    const nodeIds = new Set(definition.nodes.map((n) => n.id));
    for (const edge of definition.edges) {
      if (!nodeIds.has(edge.from)) {
        newErrors.edges = `Node "${edge.from}" tidak ditemukan`;
        break;
      }
      if (!nodeIds.has(edge.to)) {
        newErrors.edges = `Node "${edge.to}" tidak ditemukan`;
        break;
      }
    }

    setDefinitionErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (data: WorkflowFormData) => {
    // Validate definition before submit
    if (!validateDefinition()) {
      showToast("Mohon perbaiki kesalahan pada form", "error", { duration: 4000 });
      return;
    }

    // Sanitize definition - only send fields that BE expects
    const sanitizedDefinition = {
      nodes: definition.nodes.map((node) => ({
        id: node.id,
        type: node.type,
        name: node.name,
        config: node.config,
      })),
      edges: definition.edges.map((edge) => ({
        from: edge.from,
        to: edge.to,
      })),
    };

    try {
      if (isEditMode && id) {
        await updateWorkflow(Number(id), {
          name: data.name,
          description: data.description,
          definition: sanitizedDefinition,
        });
      } else {
        await createWorkflow({
          name: data.name,
          description: data.description,
          definition: sanitizedDefinition,
        });
      }

      showToast(success ?? `${isEditMode ? "Workflow berhasil diperbarui" : "Workflow berhasil dibuat"}`, "success");
      navigate(ROUTES.workflowList);
    } catch (err) {
      // Use the caught error directly, not from store (which might be stale)
      const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan";
      showToast(errorMessage, "error", { duration: 5000 });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(ROUTES.workflowList)}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Kembali
      </Button>

      <h1 className="text-2xl font-bold text-gray-900">
        {isEditMode ? "Edit Workflow" : "Buat Workflow"}
      </h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informasi Dasar</h3>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <InputField
                  {...field}
                  label="Nama Workflow"
                  placeholder="Masukkan nama workflow"
                  errorMessage={errors.name?.message}
                />
              )}
            />

            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextareaField
                  {...field}
                  label="Deskripsi"
                  placeholder="Masukkan deskripsi workflow (opsional)"
                  errorMessage={errors.description?.message}
                  rows={3}
                />
              )}
            />
          </div>

          {/* Workflow Builder */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Definisi Workflow</h3>
            <p className="text-sm text-gray-500">
              Tambahkan steps (nodes) dan koneksi (edges) untuk mendefinisikan alur workflow Anda.
            </p>
            <WorkflowBuilder
              definition={definition}
              onChange={setDefinition}
              errors={definitionErrors}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(ROUTES.workflowList)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Menyimpan..." : isEditMode ? "Save" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkflowFormPage;
