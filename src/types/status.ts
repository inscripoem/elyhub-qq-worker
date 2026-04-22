export type RuntimeState = "idle" | "running" | "stopped" | "error";

export type RecentGroup = {
  id: string;
  alias: string | null;
  qqNumber: string | null;
  name: string | null;
  status: string;
  updatedAt: string;
};

export type StatusResponse = {
  state: RuntimeState;
  napcat: {
    connected: boolean;
    host: string;
    port: number;
    error: string | null;
  };
  heartbeat: {
    lastSentAt: string | null;
    lastOkAt: string | null;
    expectedIntervalSeconds: number;
    consecutiveFailures: number;
  };
  sync: {
    lastRunAt: string | null;
    lastSuccessAt: string | null;
    lastUpdatedCount: number;
    recentGroups: RecentGroup[];
    cron: string;
    nextRunAt: string | null;
  };
};
