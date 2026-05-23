import { BarChart } from "@/components/chart/barChart";
import { useGlobalRunStats } from "@/hooks/useWorkflowRuns";
import { StatCard } from "./StatCard";
import { formatDuration } from "@/functions/formatDuration";
import type { ChartData } from "chart.js";
import {
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

export function GlobalHealthPanel() {
  const { data: stats, isLoading, error, dataUpdatedAt, refetch } = useGlobalRunStats();

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  const activeRuns = stats ? stats.byStatus.pending + stats.byStatus.running : 0;
  const totalCompleted = stats
    ? stats.byStatus.success + stats.byStatus.failed + stats.byStatus.cancelled
    : 0;

  // Chart data for status distribution
  // Using brand gradient colors: blue-500 (#3b82f6) to indigo-600 (#4f46e5)
  const statusChartData: ChartData<"bar", number[], string> | null = stats
    ? {
        labels: ["Success", "Failed", "Running", "Pending", "Timed Out", "Cancelled"],
        datasets: [
          {
            data: [
              stats.byStatus.success,
              stats.byStatus.failed,
              stats.byStatus.running,
              stats.byStatus.pending,
              stats.byStatus.timedOut,
              stats.byStatus.cancelled,
            ],
            // Brand-aligned gradient colors (blue-indigo theme)
            backgroundColor: [
              "rgba(34, 197, 94, 0.9)", // green - success
              "rgba(239, 68, 68, 0.9)", // red - failed
              "rgba(59, 130, 246, 0.9)", // blue - running (brand primary)
              "rgba(245, 158, 11, 0.9)", // amber - pending
              "rgba(79, 70, 229, 0.9)", // indigo - timed out (brand secondary)
              "rgba(107, 114, 128, 0.9)", // gray - cancelled
            ],
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      }
    : null;

  if (isLoading && !stats) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-500">Memuat statistik...</span>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mb-3" />
          <p className="text-red-600 font-medium">Gagal memuat statistik</p>
          <p className="text-sm text-gray-500 mt-1">{error instanceof Error ? error.message : String(error)}</p>
          <button
            onClick={() => refetch()}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Coba lagi
          </button>
        </div>
      </div>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <Activity className="h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-600 font-medium">No runs in the last 24 hours</p>
          <p className="text-sm text-gray-400 mt-1">
            Jalankan workflow untuk melihat statistik
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Runs */}
        <StatCard
          title="Active Runs"
          value={activeRuns}
          icon={Activity}
          color="bg-blue-500"
          subtitle={`${stats.byStatus.pending} pending, ${stats.byStatus.running} running`}
        />

        {/* Success Rate */}
        <StatCard
          title="Success Rate"
          value={`${stats.successRate.toFixed(1)}%`}
          icon={CheckCircle}
          color="bg-green-500"
          subtitle={`${stats.byStatus.success} of ${totalCompleted} completed`}
        />

        {/* Failure Rate */}
        <StatCard
          title="Failure Rate"
          value={`${stats.failureRate.toFixed(1)}%`}
          icon={XCircle}
          color="bg-red-500"
          subtitle={`${stats.byStatus.failed} failed, ${stats.byStatus.timedOut} timed out`}
        />

        {/* Average Duration */}
        <StatCard
          title="Avg. Duration"
          value={formatDuration(stats.averageDurationMs)}
          icon={Clock}
          color="bg-purple-500"
          subtitle="Average execution time"
        />
      </div>

      {/* Status Distribution Chart */}
      {statusChartData && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Run Status Distribution
          </h3>
          <div className="h-64">
            <BarChart
              data={statusChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const value = context.raw as number;
                        const total = stats.total;
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        return `${context.label}: ${value} (${percentage}%)`;
                      },
                    },
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: "rgba(0, 0, 0, 0.05)",
                    },
                    ticks: {
                      stepSize: 1,
                    },
                  },
                  x: {
                    grid: {
                      display: false,
                    },
                  },
                },
              }}
            />
          </div>
          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {[
              { label: "Success", color: "rgba(34, 197, 94, 0.8)" },
              { label: "Failed", color: "rgba(239, 68, 68, 0.8)" },
              { label: "Running", color: "rgba(59, 130, 246, 0.8)" },
              { label: "Pending", color: "rgba(245, 158, 11, 0.8)" },
              { label: "Timed Out", color: "rgba(139, 92, 246, 0.8)" },
              { label: "Cancelled", color: "rgba(107, 114, 128, 0.8)" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-gray-600">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Updated */}
      {lastUpdated && (
        <div className="flex items-center justify-end text-xs text-gray-400">
          <RefreshCw className="h-3 w-3 mr-1" />
          Updated {lastUpdated.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
