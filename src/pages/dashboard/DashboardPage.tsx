import { GlobalHealthPanel } from "./_components/GlobalHealthPanel";
import { WorkflowCard } from "./_components/WorkflowCard";
import { useAuthStore } from "@/store/authStore";
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
  GitBranch,
} from "lucide-react";

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Welcome back, {user?.name || "User"}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Multi-Tenant Workflow Orchestration Engine
        </p>
      </div>

      {/* Global Health Panel */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Health Overview
        </h2>
        <GlobalHealthPanel />
      </section>

      {/* Recent Workflows */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Recent Workflows
          </h2>
          <Link
            to={ROUTES.workflowList}
            className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoadingWorkflows ? (
          <div className="flex items-center justify-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
          </div>
        ) : recentWorkflows.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentWorkflows.map((workflow) => (
              <WorkflowCard key={workflow.id} workflow={workflow} />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center">
            <Play className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300 font-medium">No workflows yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 mb-4">
              Create your first workflow to get started
            </p>
            <Link
              to={ROUTES.workflowCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-700 transition-colors"
            >
              <Play className="h-4 w-4" />
              Create Workflow
            </Link>
          </div>
        )}
      </section>

      {/* Quick Stats */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </section>
    </div>
  );
}