import { readFile, writeFile } from "node:fs/promises";
import { watch } from "node:fs";
import { join } from "node:path";
import { Cron } from "croner";
import { createLogger } from "./logger";
import {
  DEFAULT_CONFIG,
  maskToken,
  toMaskedConfig,
  type ConfigSubscriber,
  type MaskedConfig,
  type WorkerConfig,
} from "../types/config";

const logger = createLogger("config-store");
const CONFIG_PATH = join(process.cwd(), "config.json");

function parseConfig(input: unknown): WorkerConfig {
  if (!input || typeof input !== "object") {
    throw new Error("config must be an object");
  }
  const raw = input as Record<string, unknown>;
  return {
    elyhubBaseUrl:
      typeof raw.elyhubBaseUrl === "string"
        ? raw.elyhubBaseUrl
        : DEFAULT_CONFIG.elyhubBaseUrl,
    secret:
      typeof raw.secret === "string" ? raw.secret : DEFAULT_CONFIG.secret,
    heartbeatInterval:
      typeof raw.heartbeatInterval === "number" && raw.heartbeatInterval > 0
        ? Math.floor(raw.heartbeatInterval)
        : DEFAULT_CONFIG.heartbeatInterval,
    syncCron:
      typeof raw.syncCron === "string" && raw.syncCron.trim()
        ? raw.syncCron.trim()
        : DEFAULT_CONFIG.syncCron,
    napcatHost:
      typeof raw.napcatHost === "string"
        ? raw.napcatHost
        : DEFAULT_CONFIG.napcatHost,
    napcatPort:
      typeof raw.napcatPort === "number" &&
      raw.napcatPort >= 1 &&
      raw.napcatPort <= 65535
        ? Math.floor(raw.napcatPort)
        : DEFAULT_CONFIG.napcatPort,
    napcatToken:
      typeof raw.napcatToken === "string"
        ? raw.napcatToken
        : DEFAULT_CONFIG.napcatToken,
    napcatReconnectAttempts:
      typeof raw.napcatReconnectAttempts === "number" &&
      raw.napcatReconnectAttempts >= 0
        ? Math.floor(raw.napcatReconnectAttempts)
        : DEFAULT_CONFIG.napcatReconnectAttempts,
    napcatReconnectDelay:
      typeof raw.napcatReconnectDelay === "number" &&
      raw.napcatReconnectDelay >= 0
        ? Math.floor(raw.napcatReconnectDelay)
        : DEFAULT_CONFIG.napcatReconnectDelay,
    napcatGroupDelay:
      typeof raw.napcatGroupDelay === "number" && raw.napcatGroupDelay >= 0
        ? Math.floor(raw.napcatGroupDelay)
        : DEFAULT_CONFIG.napcatGroupDelay,
    napcatIntraGroupDelay:
      typeof raw.napcatIntraGroupDelay === "number" &&
      raw.napcatIntraGroupDelay >= 0
        ? Math.floor(raw.napcatIntraGroupDelay)
        : DEFAULT_CONFIG.napcatIntraGroupDelay,
  };
}

export function validateConfig(input: unknown): WorkerConfig {
  const cfg = parseConfig(input);
  if (cfg.elyhubBaseUrl) {
    new URL(cfg.elyhubBaseUrl);
  }
  try {
    new Cron(cfg.syncCron, { maxRuns: 0 });
  } catch {
    throw new Error(`invalid cron expression: ${cfg.syncCron}`);
  }
  return cfg;
}

class ConfigStore {
  private config: WorkerConfig = { ...DEFAULT_CONFIG };
  private loaded = false;
  private subscribers = new Set<ConfigSubscriber>();
  private ignoreNextWatchEvent = false;

  async init(): Promise<void> {
    if (this.loaded) return;
    this.config = await this.readOrCreate();
    this.loaded = true;
    this.startWatcher();
  }

  get(): WorkerConfig {
    if (!this.loaded) throw new Error("ConfigStore not initialized");
    return { ...this.config };
  }

  getMasked(): MaskedConfig {
    return toMaskedConfig(this.get());
  }

  subscribe(subscriber: ConfigSubscriber): () => void {
    this.subscribers.add(subscriber);
    return () => this.subscribers.delete(subscriber);
  }

  async update(next: Partial<WorkerConfig>): Promise<WorkerConfig> {
    const merged = validateConfig({ ...this.config, ...next });
    this.ignoreNextWatchEvent = true;
    await writeFile(CONFIG_PATH, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
    this.config = merged;
    this.notifySubscribers().catch((err) =>
      logger.error({ err }, "config subscriber error")
    );
    return this.get();
  }

  private async notifySubscribers(): Promise<void> {
    const cfg = this.get();
    for (const sub of this.subscribers) {
      await sub(cfg);
    }
  }

  private async readOrCreate(): Promise<WorkerConfig> {
    let raw: string;
    try {
      raw = await readFile(CONFIG_PATH, "utf8");
    } catch {
      logger.warn("config.json missing, writing defaults");
      const defaults = { ...DEFAULT_CONFIG };
      await writeFile(CONFIG_PATH, `${JSON.stringify(defaults, null, 2)}\n`, "utf8");
      return defaults;
    }
    try {
      return parseConfig(JSON.parse(raw));
    } catch (err) {
      logger.error({ err }, "failed to parse config.json, using defaults");
      return { ...DEFAULT_CONFIG };
    }
  }

  private startWatcher(): void {
    try {
      watch(CONFIG_PATH, async (event) => {
        if (event !== "change") return;
        if (this.ignoreNextWatchEvent) {
          this.ignoreNextWatchEvent = false;
          return;
        }
        try {
          this.config = await this.readOrCreate();
          await this.notifySubscribers();
          logger.info("config hot-reloaded from disk");
        } catch (err) {
          logger.error({ err }, "config hot-reload failed");
        }
      });
    } catch (err) {
      logger.warn({ err }, "config file watcher unavailable");
    }
  }
}

export const configStore = new ConfigStore();

export function maskSecret(s: string): string {
  return maskToken(s);
}
