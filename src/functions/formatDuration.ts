export function formatDuration(ms: number): string {
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
