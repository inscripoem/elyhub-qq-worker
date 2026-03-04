import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createLogger } from "./logger";
import type { RecentGroup } from "../types/status";

const logger = createLogger("state-store");
const STATE_PATH = join(process.cwd(), "state.json");

type HeartbeatState = {
  lastSentAt: string | null;
  lastOkAt: string | null;
  consecutiveFailures: number;
};

type SyncState = {
  lastRunAt: string | null;
  lastSuccessAt: string | null;
  lastUpdatedCount: number;
  recentGroups: RecentGroup[];
};

type PersistedState = {
  heartbeat: HeartbeatState;
  sync: SyncState;
};

const DEFAULT_STATE: PersistedState = {
  heartbeat: { lastSentAt: null, lastOkAt: null, consecutiveFailures: 0 },
  sync: { lastRunAt: null, lastSuccessAt: null, lastUpdatedCount: 0, recentGroups: [] },
};

class StateStore {
  private state: PersistedState = structuredClone(DEFAULT_STATE);
  private writeTimer: ReturnType<typeof setTimeout> | null = null;

  async init(): Promise<void> {
    try {
      const raw = await readFile(STATE_PATH, "utf8");
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      this.state = {
        heartbeat: { ...DEFAULT_STATE.heartbeat, ...parsed.heartbeat },
        sync: {
          ...DEFAULT_STATE.sync,
          ...parsed.sync,
          recentGroups: Array.isArray(parsed.sync?.recentGroups)
            ? parsed.sync.recentGroups
            : [],
        },
      };
      logger.debug("state loaded from disk");
    } catch {
      // File doesn't exist yet or is malformed — start with defaults
    }
  }

  getHeartbeat(): HeartbeatState {
    return { ...this.state.heartbeat };
  }

  getSync(): SyncState {
    return { ...this.state.sync, recentGroups: [...this.state.sync.recentGroups] };
  }

  setHeartbeat(stats: HeartbeatState): void {
    this.state.heartbeat = { ...stats };
    this.scheduleSave();
  }

  setSync(stats: SyncState): void {
    this.state.sync = { ...stats, recentGroups: [...stats.recentGroups] };
    this.scheduleSave();
  }

  private scheduleSave(): void {
    if (this.writeTimer !== null) return;
    this.writeTimer = setTimeout(() => {
      this.writeTimer = null;
      this.flush().catch((err) => logger.warn({ err }, "state save failed"));
    }, 1000);
  }

  async flush(): Promise<void> {
    await writeFile(STATE_PATH, `${JSON.stringify(this.state, null, 2)}\n`, "utf8");
  }
}

export const stateStore = new StateStore();
