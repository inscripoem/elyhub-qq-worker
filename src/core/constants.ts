export const WORKER_CAPABILITIES = [
  "status",
  "name",
  "avatar_url",
  "join_link",
  "expire_at",
] as const;

export const DEFAULT_HEARTBEAT_INTERVAL_SECONDS = 60;
export const DEFAULT_SYNC_INTERVAL_SECONDS = 300;
export const SYNC_EXPIRE_GRACE_FACTOR = 1.1;
export const BATCH_LIMIT = 100;
export const CONCURRENCY_LIMIT = 10;
export const RECENT_GROUPS_LIMIT = 50;
