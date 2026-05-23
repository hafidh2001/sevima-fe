import { useEffect, useState, useCallback } from "react";
import { workflowRunApi } from "@/services/workflowRunApi";
import { GlobalRunStats } from "@/types/workflow";
import {
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

interface GlobalHealthPanelProps {
  refreshInterval?: number; // in milliseconds, default 30000 (30 seconds)
}

function formatDuration(ms: number): string {
  if (ms === 0) return "-";
  if (ms < 1000) return "< 1s";
  if (ms < 60000) return `${Math.floor(ms / 1000)}s`;
  if (ms < 3600000) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function GlobalHealthPanel({ refreshInterval = 30000 }: GlobalHealthPanelProps) {
  const [stats, setStats] = useState<GlobalRunStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const data = await workflowRunApi.getGlobalStats();
      setStats(data);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load stats";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    const intervalId = setInterval(fetchStats, refreshInterval);

    return () => clearInterval(intervalId);
  }, [fetchStats, refreshInterval]);

  const activeRuns = stats ? stats.byStatus.pending + stats.byStatus.running : 0;
  const totalCompleted = stats
    ? stats.byStatus.success + stats.byStatus.failed + stats.byStatus.cancelled
    : 0;

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
          <p className="text-sm text-gray-500 mt-1">{error}</p>
          <button
            onClick={fetchStats}
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
