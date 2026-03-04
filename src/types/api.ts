export type WorkerPlatform = "qq";

export type WorkerRemoteConfig = {
  platform: WorkerPlatform;
  enabled: boolean;
};

export type WorkerGroupStatus = "ACTIVE" | "INVALID" | "UNKNOWN";

export type WorkerGroup = {
  id: string;
  platform: WorkerPlatform;
  alias: string | null;
  name: string | null;
  qqNumber: string | null;
  joinLink: string | null;
  adminQq: string | null;
  status: WorkerGroupStatus;
  expireAt: string | null;
  avatarUrl: string | null;
  useWorker: boolean | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkerGroupListResponse = {
  data: WorkerGroup[];
};

export type WorkerHeartbeatPayload = {
  capabilities: string[];
  expectedIntervalSeconds: number;
};

export type WorkerGroupBatchUpdate = {
  id: string;
  status?: WorkerGroupStatus;
  name?: string | null;
  avatarUrl?: string | null;
  joinLink?: string | null;
  expireAt?: string | null;
};

export type WorkerGroupBatchResponse = {
  ok: boolean;
  updated: string[];
  notFound: string[];
};

export type WorkerApiErrorBody = {
  error?: string;
  message?: string;
  code?: string;
};

export function shouldUseWorker(useWorker: boolean | null): boolean {
  return useWorker !== false;
}
