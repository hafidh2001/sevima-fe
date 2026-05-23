import { Link } from "react-router-dom";
import { WorkflowStatusEnum } from "@/types";
import { WorkflowResponse } from "@/types/workflow";
import { ROUTES } from "@/utils/routes";
import { GitBranch, Pencil } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

interface WorkflowCardProps {
  workflow: WorkflowResponse;
}

export function WorkflowCard({ workflow }: WorkflowCardProps) {
  const getStatusColor = (status: WorkflowStatusEnum) => {
    switch (status) {
      case WorkflowStatusEnum.ACTIVE:
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300";
      case WorkflowStatusEnum.DRAFT:
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300";
      case WorkflowStatusEnum.ARCHIVED:
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
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
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
              {workflow.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
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
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            title="View"
          >
            <GitBranch className="h-4 w-4" />
          </Link>
          <Link
            to={ROUTES.workflowEdit.replace(":id", String(workflow.id))}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
