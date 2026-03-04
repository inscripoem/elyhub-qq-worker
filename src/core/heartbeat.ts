import { createLogger } from "../services/logger";
import { elyHubClient } from "../services/elyhub-client";
import { configStore } from "../services/config-store";
import { stateStore } from "../services/state-store";
import { WORKER_CAPABILITIES } from "./constants";
import { Scheduler } from "./scheduler";

const logger = createLogger("heartbeat");

export class HeartbeatService {
  private readonly scheduler = new Scheduler();
  private started = false;
  private onTick: (() => void) | null = null;
  private stats = stateStore.getHeartbeat();

  loadState(): void {
    this.stats = stateStore.getHeartbeat();
  }

  start(onTick?: () => void): void {
    if (this.started) return;
    this.started = true;
    this.onTick = onTick ?? null;
    const ms = configStore.get().heartbeatInterval * 1000;
    this.scheduler.every(ms, () => this.tick(), true);
  }

  stop(): void {
    if (!this.started) return;
    this.started = false;
    this.scheduler.clearAll();
  }

  getStats() {
    return {
      ...this.stats,
      expectedIntervalSeconds: configStore.get().heartbeatInterval,
    };
  }

  private async tick(): Promise<void> {
    const cfg = configStore.get();
    try {
      const remote = await elyHubClient.getWorkerConfig(cfg);
      if (!remote.enabled) {
        logger.debug("worker disabled, skipping heartbeat");
        return;
      }
      this.stats.lastSentAt = new Date().toISOString();
      await elyHubClient.sendHeartbeat(cfg, {
        capabilities: [...WORKER_CAPABILITIES],
        expectedIntervalSeconds: cfg.heartbeatInterval,
      });
      this.stats.lastOkAt = new Date().toISOString();
      this.stats.consecutiveFailures = 0;
      logger.debug("heartbeat ok");
    } catch (err) {
      this.stats.consecutiveFailures += 1;
      logger.warn({ err }, "heartbeat failed");
    } finally {
      stateStore.setHeartbeat(this.stats);
      this.onTick?.();
    }
  }
}
