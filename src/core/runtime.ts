import { Cron } from "croner";
import { createLogger } from "../services/logger";
import { configStore } from "../services/config-store";
import { napcatService } from "../services/napcat";
import { statusBroadcaster } from "../services/status-broadcaster";
import { HeartbeatService } from "./heartbeat";
import { SyncService } from "./sync";
import { Scheduler } from "./scheduler";
import type { StatusResponse } from "../types/status";

const logger = createLogger("runtime");

export class RuntimeManager {
  private state: StatusResponse["state"] = "idle";
  private readonly heartbeat = new HeartbeatService();
  private readonly sync = new SyncService();
  private readonly scheduler = new Scheduler();
  private unsubscribeConfig: (() => void) | null = null;

  constructor() {
    this.unsubscribeConfig = configStore.subscribe(async (next) => {
      if (this.state !== "running") return;
      try {
        await napcatService.reconnect(
          next.napcatHost,
          next.napcatPort,
          next.napcatToken,
          next.napcatReconnectAttempts,
          next.napcatReconnectDelay
        );
        this.heartbeat.stop();
        this.heartbeat.start();
        this.scheduler.clearAll();
        this.scheduler.cron(next.syncCron, () => this.syncTick());
        logger.info("runtime hot-reloaded from config");
      } catch (err) {
        this.state = "error";
        logger.error({ err }, "runtime hot-reload failed");
      }
    });
  }

  async start(): Promise<void> {
    if (this.state === "running") return;
    const cfg = configStore.get();
    try {
      await napcatService.connect(
        cfg.napcatHost,
        cfg.napcatPort,
        cfg.napcatToken,
        cfg.napcatReconnectAttempts,
        cfg.napcatReconnectDelay
      );
      this.heartbeat.start(() => statusBroadcaster.notify(this.getStatus()));
      this.scheduler.clearAll();
      this.scheduler.cron(cfg.syncCron, () => this.syncTick());
      this.state = "running";
      logger.info("runtime started");
    } catch (err) {
      this.state = "error";
      logger.error({ err }, "runtime start failed");
      throw err;
    } finally {
      statusBroadcaster.notify(this.getStatus());
    }
  }

  async stop(): Promise<void> {
    if (this.state === "stopped" || this.state === "idle") {
      this.state = "stopped";
      statusBroadcaster.notify(this.getStatus());
      return;
    }
    this.scheduler.clearAll();
    this.heartbeat.stop();
    await napcatService.disconnect();
    this.state = "stopped";
    logger.info("runtime stopped");
    statusBroadcaster.notify(this.getStatus());
  }

  async restart(): Promise<void> {
    await this.stop();
    await this.start();
  }

  async dispose(): Promise<void> {
    await this.stop();
    if (this.unsubscribeConfig) {
      this.unsubscribeConfig();
      this.unsubscribeConfig = null;
    }
  }

  loadState(): void {
    this.heartbeat.loadState();
    this.sync.loadState();
  }

  getState(): StatusResponse["state"] {
    return this.state;
  }

  getStatus(): StatusResponse {
    const cfg = configStore.get();
    const conn = napcatService.getConnectionInfo();
    const nextRunAt = (() => {
      try {
        return new Cron(cfg.syncCron).nextRun()?.toISOString() ?? null;
      } catch {
        return null;
      }
    })();
    return {
      state: this.state,
      napcat: {
        connected: napcatService.isConnected(),
        host: conn.host || cfg.napcatHost,
        port: conn.port || cfg.napcatPort,
        error: conn.error,
      },
      heartbeat: this.heartbeat.getStats(),
      sync: { ...this.sync.getStats(), cron: cfg.syncCron, nextRunAt },
    };
  }

  async syncNow(): Promise<number> {
    if (this.state !== "running") {
      throw new Error("worker is not running");
    }
    try {
      return await this.sync.runOnce();
    } finally {
      statusBroadcaster.notify(this.getStatus());
    }
  }

  private async syncTick(): Promise<void> {
    try {
      await this.sync.runOnce();
    } catch (err) {
      logger.warn({ err }, "sync tick failed");
    } finally {
      statusBroadcaster.notify(this.getStatus());
    }
  }
}

export const runtimeManager = new RuntimeManager();
