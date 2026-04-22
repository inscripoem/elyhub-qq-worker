import { createLogger } from "./logger";
import type {
  WorkerApiErrorBody,
  WorkerGroupBatchResponse,
  WorkerGroupBatchUpdate,
  WorkerGroupListResponse,
  WorkerHeartbeatPayload,
  WorkerRemoteConfig,
} from "../types/api";
import type { WorkerConfig } from "../types/config";

const logger = createLogger("elyhub-client");
const DEFAULT_TIMEOUT_MS = 10_000;

export class ElyHubHttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body?: WorkerApiErrorBody | unknown
  ) {
    super(message);
    this.name = "ElyHubHttpError";
  }
}

export class ElyHubClient {
  private baseHeaders(config: WorkerConfig): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.secret}`,
      "X-Worker-Platform": "qq",
    };
  }

  private async request<T>(
    config: WorkerConfig,
    path: string,
    init: RequestInit = {},
    timeoutMs = DEFAULT_TIMEOUT_MS
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const url = new URL(path, config.elyhubBaseUrl).toString();
      const res = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: {
          ...this.baseHeaders(config),
          ...(init.headers ?? {}),
        },
      });

      const contentType = res.headers.get("content-type") ?? "";
      const body = contentType.includes("application/json")
        ? await res.json()
        : await res.text();

      if (!res.ok) {
        throw new ElyHubHttpError(
          res.status,
          `elyhub request failed: ${res.status} ${path}`,
          body
        );
      }
      return body as T;
    } catch (err) {
      if (!(err instanceof ElyHubHttpError)) {
        logger.error({ err, path }, "elyhub request error");
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  getWorkerConfig(config: WorkerConfig): Promise<WorkerRemoteConfig> {
    return this.request<WorkerRemoteConfig>(config, "/api/worker/config", {
      method: "GET",
    });
  }

  sendHeartbeat(
    config: WorkerConfig,
    payload: WorkerHeartbeatPayload
  ): Promise<{ ok: true }> {
    return this.request<{ ok: true }>(config, "/api/worker/heartbeat", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  getGroups(config: WorkerConfig, search?: string): Promise<WorkerGroupListResponse> {
    const qs = new URLSearchParams({ platform: "qq" });
    if (search) qs.set("search", search);
    return this.request<WorkerGroupListResponse>(
      config,
      `/api/worker/groups?${qs.toString()}`,
      { method: "GET" }
    );
  }

  getPartialGroups(
    config: WorkerConfig,
    missing: string[]
  ): Promise<WorkerGroupListResponse> {
    const qs = new URLSearchParams({
      platform: "qq",
      missing: missing.join(","),
    }).toString();
    return this.request<WorkerGroupListResponse>(
      config,
      `/api/worker/groups/partial?${qs}`,
      { method: "GET" }
    );
  }

  postBatch(
    config: WorkerConfig,
    payload: WorkerGroupBatchUpdate[]
  ): Promise<WorkerGroupBatchResponse> {
    return this.request<WorkerGroupBatchResponse>(
      config,
      "/api/worker/groups/batch",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  }
}

export const elyHubClient = new ElyHubClient();
