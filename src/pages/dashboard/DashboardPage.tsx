import { GlobalHealthPanel } from "./_components/GlobalHealthPanel";
import { useAuthStore } from "@/store/authStore";
import { WorkflowStatusEnum } from "@/types";
import { workflowApi } from "@/services/workflowApi";
import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/utils/routes";
import {
  WorkflowResponse,
  WorkflowQueryParams,
} from "@/types/workflow";
import {
  ArrowRight,
  Loader2,
  Play,
  Pencil,
  GitBranch,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

function WorkflowCard({ workflow }: { workflow: WorkflowResponse }) {
  const getStatusColor = (status: WorkflowStatusEnum) => {
    switch (status) {
      case WorkflowStatusEnum.ACTIVE:
        return "bg-green-100 text-green-700";
      case WorkflowStatusEnum.DRAFT:
        return "bg-yellow-100 text-yellow-700";
      case WorkflowStatusEnum.ARCHIVED:
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">
              {workflow.name}
            </h3>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                workflow.status
              )}`}
            >
              {workflow.status}
            </span>
          </div>
          {workflow.description && (
            <p className="text-sm text-gray-500 line-clamp-2 mb-3">
              {workflow.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>{workflow._count.runs} runs</span>
            <span>•</span>
            <span>v{workflow.latestVersion?.version || 0}</span>
            <span>•</span>
            <span>
              {formatDistanceToNow(new Date(workflow.updatedAt), {
                addSuffix: true,
                locale: id,
              })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 ml-3">
          <Link
            to={ROUTES.workflowDetail.replace(":id", String(workflow.id))}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View"
          >
            <GitBranch className="h-4 w-4" />
          </Link>
          <Link
            to={ROUTES.workflowEdit.replace(":id", String(workflow.id))}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [recentWorkflows, setRecentWorkflows] = useState<WorkflowResponse[]>([]);
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(true);

  const fetchRecentWorkflows = useCallback(async () => {
    setIsLoadingWorkflows(true);
    try {
      const params: WorkflowQueryParams = {
        page: 1,
        limit: 5,
        sortBy: "updatedAt",
        sortOrder: "desc",
      };
      const response = await workflowApi.getAll(params);
      setRecentWorkflows(response.data);
    } catch (error) {
      console.error("Failed to fetch recent workflows:", error);
    } finally {
      setIsLoadingWorkflows(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentWorkflows();
  }, [fetchRecentWorkflows]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name || "User"}
        </h1>
        <p className="text-gray-500 mt-1">
          Multi-Tenant Workflow Orchestration Engine
        </p>
      </div>

      {/* Global Health Panel */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Health Overview
        </h2>
        <GlobalHealthPanel />
      </section>

      {/* Recent Workflows */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Recent Workflows
          </h2>
          <Link
            to={ROUTES.workflowList}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoadingWorkflows ? (
          <div className="flex items-center justify-center py-12 bg-white rounded-xl border border-gray-200">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : recentWorkflows.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentWorkflows.map((workflow) => (
              <WorkflowCard key={workflow.id} workflow={workflow} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <Play className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No workflows yet</p>
            <p className="text-sm text-gray-400 mt-1 mb-4">
              Create your first workflow to get started
            </p>
            <Link
              to={ROUTES.workflowCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Play className="h-4 w-4" />
              Create Workflow
            </Link>
          </div>
        )}
      </section>

      {/* Quick Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to={ROUTES.workflowCreate}
          className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white hover:shadow-lg transition-shadow"
        >
          <Play className="h-8 w-8 mb-3" />
          <h3 className="font-semibold text-lg">Create Workflow</h3>
          <p className="text-blue-100 text-sm mt-1">
            Define new automated workflows
          </p>
        </Link>

        <Link
          to={ROUTES.workflowList}
          className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white hover:shadow-lg transition-shadow"
        >
          <GitBranch className="h-8 w-8 mb-3" />
          <h3 className="font-semibold text-lg">Manage Workflows</h3>
          <p className="text-green-100 text-sm mt-1">
            View and edit existing workflows
          </p>
        </Link>

        <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl p-6 text-white">
          <Activity className="h-8 w-8 mb-3" />
          <h3 className="font-semibold text-lg">Monitor Runs</h3>
          <p className="text-purple-100 text-sm mt-1">
            Track workflow execution status
          </p>
        </div>
      </section>
    </div>
  );
}

function Activity(props: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
