import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wand2, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextareaField } from "@/components/fields/textareaField";
import { WorkflowBuilder } from "@/components/workflow/WorkflowBuilder";
import { useAIStore } from "@/store/aiStore";
import { ROUTES } from "@/utils/routes";
import { showToast } from "@/utils/toast";
import type { WorkflowDefinition } from "@/types/workflow";

const SUGGESTED_PROMPTS = [
  "Ambil data user dari API dan kirim notifikasi email",
  "Download file dari URL, proses CSV, dan simpan ke database",
  "Cek harga produk dari 3 API berbeda, bandingkan, dan simpan yang termurah",
  "Ambil data dari database, generate laporan PDF, kirim via email",
];

export const AIWorkflowBuilderPage = () => {
  const navigate = useNavigate();
  const {
    generatedWorkflow,
    isGenerating,
    isSaving,
    error,
    generateWorkflow,
    saveWorkflow,
    reset,
  } = useAIStore();

  const [description, setDescription] = useState("");
  const [definitionErrors, setDefinitionErrors] = useState<{
    nodes?: string;
    edges?: string;
    general?: string;
  }>({});

  const handleGenerate = async () => {
    if (!description.trim()) {
      showToast("Deskripsikan workflow yang ingin dibuat", "error");
      return;
    }

    if (description.trim().length < 10) {
      showToast("Deskripsi minimal 10 karakter", "error");
      return;
    }

    try {
      await generateWorkflow(description.trim());
      showToast("Workflow berhasil dibuat dari deskripsi", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      showToast(message, "error", { duration: 5000 });
    }
  };

  const handleSave = async () => {
    if (!generatedWorkflow) return;

    if (!validateDefinition()) {
      showToast("Mohon perbaiki kesalahan pada workflow", "error");
      return;
    }

    try {
      await saveWorkflow(generatedWorkflow);
      showToast("Workflow berhasil disimpan", "success");
      navigate(ROUTES.workflowList);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      showToast(message, "error", { duration: 5000 });
    }
  };

  const validateDefinition = (): boolean => {
    if (!generatedWorkflow) return false;

    const newErrors: typeof definitionErrors = {};
    const { definition } = generatedWorkflow;

    if (definition.nodes.length === 0) {
      newErrors.nodes = "Minimal satu step harus ditambahkan";
    }

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

  const handleDefinitionChange = (definition: WorkflowDefinition) => {
    if (generatedWorkflow) {
      useAIStore.setState({
        generatedWorkflow: {
          ...generatedWorkflow,
          definition,
        },
      });
    }
  };

  const handleReset = () => {
    setDescription("");
    reset();
    setDefinitionErrors({});
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

      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Wand2 className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Workflow Builder</h1>
          <p className="text-sm text-gray-500">
            Buat workflow dengan describing dalam bahasa natural
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="space-y-4">
          <div>
            <TextareaField
              value={description}
              onChange={setDescription}
              label="Deskripsi Workflow"
              placeholder="Contoh: Ambil data user dari API, proses hasilnya, lalu kirim email notifikasi"
              rows={4}
              disabled={isGenerating}
            />
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-2">Contoh prompt:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setDescription(prompt)}
                  className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors"
                  disabled={isGenerating}
                >
                  {prompt.slice(0, 40)}...
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !description.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Membuat Workflow...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate Workflow
                </>
              )}
            </Button>

            {generatedWorkflow && (
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isGenerating || isSaving}
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <p className="font-medium text-red-700">Gagal Membuat Workflow</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {generatedWorkflow && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {generatedWorkflow.name}
              </h2>
              {generatedWorkflow.description && (
                <p className="text-sm text-gray-500 mt-1">
                  {generatedWorkflow.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Generated</span>
            </div>
          </div>

          <WorkflowBuilder
            definition={generatedWorkflow.definition}
            onChange={handleDefinitionChange}
            errors={definitionErrors}
          />

          <div className="flex justify-end gap-3 pt-6 border-t mt-6">
            <Button
              variant="outline"
              onClick={() => navigate(ROUTES.workflowList)}
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || isGenerating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Workflow"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIWorkflowBuilderPage;