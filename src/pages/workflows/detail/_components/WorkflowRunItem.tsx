import { useEffect, useState } from "react";
import {
  Loader2,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Ban,
  RotateCcw,
} from "lucide-react";

import { WorkflowRun, StepRun, RunStatusEnum, StepStatusEnum } from "@/types/workflow";
import { workflowRunApi } from "@/services/workflowRunApi";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow, format } from "date-fns";
import { id } from "date-fns/locale";

export function WorkflowRunItem({
  run,
  isExpanded,
  onToggle,
  onCancel,
  onRetry,
  workflowId,
}: {
  run: WorkflowRun;
  isExpanded: boolean;
  onToggle: () => void;
  onCancel: () => void;
  onRetry: () => void;
  workflowId: number;
}) {
  const [stepRuns, setStepRuns] = useState<StepRun[]>([]);
  const [isLoadingSteps, setIsLoadingSteps] = useState(false);

  useEffect(() => {
    if (isExpanded && !run.stepRuns) {
      loadStepRuns();
    } else if (run.stepRuns) {
      setStepRuns(run.stepRuns);
    }
  }, [isExpanded, run]);

  const loadStepRuns = async () => {
    setIsLoadingSteps(true);
    try {
      const data = await workflowRunApi.getById(workflowId, run.id);
      setStepRuns(data.stepRuns || []);
    } catch (error) {
      console.error("Failed to load step runs:", error);
    } finally {
      setIsLoadingSteps(false);
    }
  };

  const getStatusIcon = (status: RunStatusEnum) => {
    switch (status) {
      case RunStatusEnum.SUCCESS:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case RunStatusEnum.FAILED:
        return <XCircle className="h-4 w-4 text-red-500" />;
      case RunStatusEnum.RUNNING:
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case RunStatusEnum.PENDING:
        return <Clock className="h-4 w-4 text-gray-400" />;
      case RunStatusEnum.CANCELLED:
        return <Ban className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStepStatusIcon = (status: StepStatusEnum) => {
    switch (status) {
      case StepStatusEnum.SUCCESS:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case StepStatusEnum.FAILED:
        return <XCircle className="h-4 w-4 text-red-500" />;
      case StepStatusEnum.RUNNING:
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case StepStatusEnum.PENDING:
        return <Clock className="h-4 w-4 text-gray-400" />;
      case StepStatusEnum.SKIPPED:
        return <Ban className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const formatDuration = (start: string | null, end: string | null) => {
    if (!start) return "-";
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();
    const diff = endDate.getTime() - startDate.getTime();
    if (diff < 1000) return "< 1s";
    if (diff < 60000) return `${Math.floor(diff / 1000)}s`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ${Math.floor((diff % 60000) / 1000)}s`;
    return `${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m`;
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          {getStatusIcon(run.status)}
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              Run #{run.id}
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                {formatDistanceToNow(new Date(run.createdAt), { addSuffix: true, locale: id })}
              </span>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {format(new Date(run.createdAt), "dd MMM yyyy HH:mm:ss", { locale: id })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              run.status === RunStatusEnum.SUCCESS
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                : run.status === RunStatusEnum.FAILED
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                : run.status === RunStatusEnum.RUNNING
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                : run.status === RunStatusEnum.CANCELLED
                ? "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
            }`}
          >
            {run.status}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            <Clock className="h-4 w-4 inline mr-1" />
            {formatDuration(run.startedAt, run.completedAt)}
          </span>
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
          {isLoadingSteps ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : stepRuns.length > 0 ? (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Step Details</h4>
              {stepRuns.map((step) => (
                <div
                  key={step.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStepStatusIcon(step.status)}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{step.stepName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">{step.stepType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          step.status === StepStatusEnum.SUCCESS
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            : step.status === StepStatusEnum.FAILED
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                            : step.status === StepStatusEnum.RUNNING
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                            : step.status === StepStatusEnum.SKIPPED
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {step.status}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDuration(step.startedAt, step.completedAt)}
                      </span>
                      {step.retryCount > 0 && (
                        <span className="text-xs text-orange-500 dark:text-orange-400">
                          Retry #{step.retryCount}
                        </span>
                      )}
                    </div>
                  </div>
                  {step.error && (
                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
                      {step.error}
                    </div>
                  )}
                  {step.output && (
                    <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs font-mono overflow-x-auto">
                      <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                        {JSON.stringify(step.output, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">Tidak ada detail step</p>
          )}

          {run.status === RunStatusEnum.FAILED && (
            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onRetry();
                }}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </div>
          )}

          {run.status === RunStatusEnum.RUNNING && (
            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel();
                }}
              >
                <Ban className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
