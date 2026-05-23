import { jwtService } from "@/functions/jwt";
import { StepStatusEvent, RunStatusEvent, StepStatusEnum, RunStatusEnum } from "@/types/workflow";

type StepStatusCallback = (event: StepStatusEvent) => void;
type RunStatusCallback = (event: RunStatusEvent) => void;
type ErrorCallback = (error: Event) => void;
type ConnectionCallback = () => void;

interface SSESubscription {
  eventSource: EventSource | null;
  stepCallbacks: Set<StepStatusCallback>;
  runCallbacks: Set<RunStatusCallback>;
  errorCallbacks: Set<ErrorCallback>;
  connectCallbacks: Set<ConnectionCallback>;
  disconnectCallbacks: Set<ConnectionCallback>;
  isConnected: boolean;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  reconnectDelay: number;
  currentRunId: number | null;
}

const MAX_RECONNECT_ATTEMPTS = 5;
const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;

class SSEService {
  private subscription: SSESubscription;

  constructor() {
    this.subscription = {
      eventSource: null,
      stepCallbacks: new Set(),
      runCallbacks: new Set(),
      errorCallbacks: new Set(),
      connectCallbacks: new Set(),
      disconnectCallbacks: new Set(),
      isConnected: false,
      reconnectAttempts: 0,
      maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectDelay: INITIAL_RECONNECT_DELAY,
      currentRunId: null,
    };
  }

  private getAccessToken(): string | null {
    const tokens = jwtService.getTokens();
    return tokens.accessToken || null;
  }

  subscribeToRun(
    runId: number,
    callbacks: {
      onStepUpdate?: StepStatusCallback;
      onRunUpdate?: RunStatusCallback;
      onError?: ErrorCallback;
      onConnect?: ConnectionCallback;
      onDisconnect?: ConnectionCallback;
    }
  ): () => void {
    const { onStepUpdate, onRunUpdate, onError, onConnect, onDisconnect } = callbacks;

    // Add callbacks to sets
    if (onStepUpdate) this.subscription.stepCallbacks.add(onStepUpdate);
    if (onRunUpdate) this.subscription.runCallbacks.add(onRunUpdate);
    if (onError) this.subscription.errorCallbacks.add(onError);
    if (onConnect) this.subscription.connectCallbacks.add(onConnect);
    if (onDisconnect) this.subscription.disconnectCallbacks.add(onDisconnect);

    // If already subscribed to this run, don't reconnect
    if (
      this.subscription.eventSource &&
      this.subscription.currentRunId === runId &&
      this.subscription.isConnected
    ) {
      return this.getUnsubscribeFunction(runId, onStepUpdate, onRunUpdate, onError, onConnect, onDisconnect);
    }

    // Unsubscribe from previous run if any
    this.unsubscribe();

    this.subscription.currentRunId = runId;
    this.connect(runId);

    return this.getUnsubscribeFunction(runId, onStepUpdate, onRunUpdate, onError, onConnect, onDisconnect);
  }

  private getUnsubscribeFunction(
    _runId: number,
    onStepUpdate?: StepStatusCallback,
    onRunUpdate?: RunStatusCallback,
    onError?: ErrorCallback,
    onConnect?: ConnectionCallback,
    onDisconnect?: ConnectionCallback
  ): () => void {
    return () => {
      if (onStepUpdate) this.subscription.stepCallbacks.delete(onStepUpdate);
      if (onRunUpdate) this.subscription.runCallbacks.delete(onRunUpdate);
      if (onError) this.subscription.errorCallbacks.delete(onError);
      if (onConnect) this.subscription.connectCallbacks.delete(onConnect);
      if (onDisconnect) this.subscription.disconnectCallbacks.delete(onDisconnect);

      // If no more callbacks, unsubscribe completely
      if (
        this.subscription.stepCallbacks.size === 0 &&
        this.subscription.runCallbacks.size === 0
      ) {
        this.unsubscribe();
      }
    };
  }

  private connect(runId: number): void {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) {
      console.error("API URL not configured");
      return;
    }

    // Pass access token as query parameter since EventSource doesn't support custom headers
    const token = this.getAccessToken();
    const url = token
      ? `${apiUrl}/runs/${runId}/stream?token=${encodeURIComponent(token)}`
      : `${apiUrl}/runs/${runId}/stream`;

    const eventSource = new EventSource(url);

    this.subscription.eventSource = eventSource;

    eventSource.onopen = () => {
      this.subscription.isConnected = true;
      this.subscription.reconnectAttempts = 0;
      this.subscription.reconnectDelay = INITIAL_RECONNECT_DELAY;
      this.subscription.connectCallbacks.forEach((cb) => cb());
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error("Failed to parse SSE message:", error);
      }
    };

    eventSource.addEventListener("step_update", (event: MessageEvent) => {
      try {
        const data: StepStatusEvent = JSON.parse(event.data);
        this.subscription.stepCallbacks.forEach((cb) => cb(data));
      } catch (error) {
        console.error("Failed to parse step_update event:", error);
      }
    });

    eventSource.addEventListener("run_status", (event: MessageEvent) => {
      try {
        const data: RunStatusEvent = JSON.parse(event.data);
        this.subscription.runCallbacks.forEach((cb) => cb(data));
      } catch (error) {
        console.error("Failed to parse run_status event:", error);
      }
    });

    eventSource.onerror = (error) => {
      console.error("SSE error:", error);
      this.subscription.errorCallbacks.forEach((cb) => cb(error));

      if (this.subscription.isConnected) {
        this.subscription.isConnected = false;
        this.subscription.disconnectCallbacks.forEach((cb) => cb());
      }

      // Attempt reconnection
      this.attemptReconnect(runId);
    };
  }

  private handleMessage(data: { type?: string; [key: string]: unknown }): void {
    const type = data.type as string | undefined;

    if (type === "step_update") {
      const event = data as unknown as StepStatusEvent;
      this.subscription.stepCallbacks.forEach((cb) => cb(event));
    } else if (type === "run_status") {
      const event = data as unknown as RunStatusEvent;
      this.subscription.runCallbacks.forEach((cb) => cb(event));
    }
  }

  private attemptReconnect(runId: number): void {
    if (
      this.subscription.reconnectAttempts >= this.subscription.maxReconnectAttempts
    ) {
      console.error("Max reconnection attempts reached");
      return;
    }

    if (!this.subscription.isConnected && this.subscription.currentRunId === runId) {
      this.subscription.reconnectAttempts++;

      const delay = Math.min(
        this.subscription.reconnectDelay * Math.pow(2, this.subscription.reconnectAttempts - 1),
        MAX_RECONNECT_DELAY
      );

      console.log(
        `Attempting to reconnect in ${delay}ms (attempt ${this.subscription.reconnectAttempts})`
      );

      setTimeout(() => {
        if (
          !this.subscription.isConnected &&
          this.subscription.currentRunId === runId
        ) {
          this.connect(runId);
        }
      }, delay);
    }
  }

  unsubscribe(): void {
    if (this.subscription.eventSource) {
      this.subscription.eventSource.close();
      this.subscription.eventSource = null;
    }
    this.subscription.isConnected = false;
    this.subscription.currentRunId = null;
    this.subscription.reconnectAttempts = 0;
    this.subscription.reconnectDelay = INITIAL_RECONNECT_DELAY;
  }

  unsubscribeFromRun(runId: number): void {
    if (this.subscription.currentRunId === runId) {
      this.unsubscribe();
    }
  }

  isConnected(): boolean {
    return this.subscription.isConnected;
  }

  getCurrentRunId(): number | null {
    return this.subscription.currentRunId;
  }
}

// Export singleton instance
export const sseService = new SSEService();

// Helper function to get node status color
export function getStepStatusColor(status: StepStatusEnum): string {
  switch (status) {
    case StepStatusEnum.PENDING:
      return "#9ca3af"; // gray-400
    case StepStatusEnum.RUNNING:
      return "#3b82f6"; // blue-500
    case StepStatusEnum.SUCCESS:
      return "#22c55e"; // green-500
    case StepStatusEnum.FAILED:
      return "#ef4444"; // red-500
    case StepStatusEnum.SKIPPED:
      return "#f59e0b"; // amber-500
    default:
      return "#9ca3af"; // gray-400
  }
}

// Helper function to get run status color
export function getRunStatusColor(status: RunStatusEnum): string {
  switch (status) {
    case RunStatusEnum.PENDING:
      return "#9ca3af"; // gray-400
    case RunStatusEnum.RUNNING:
      return "#3b82f6"; // blue-500
    case RunStatusEnum.SUCCESS:
      return "#22c55e"; // green-500
    case RunStatusEnum.FAILED:
      return "#ef4444"; // red-500
    case RunStatusEnum.TIMED_OUT:
      return "#f59e0b"; // amber-500
    case RunStatusEnum.CANCELLED:
      return "#6b7280"; // gray-500
    default:
      return "#9ca3af"; // gray-400
  }
}
