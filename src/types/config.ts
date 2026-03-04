export type WorkerConfig = {
  elyhubBaseUrl: string;
  secret: string;
  heartbeatInterval: number;
  syncCron: string;
  napcatHost: string;
  napcatPort: number;
  napcatToken: string;
  napcatReconnectAttempts: number;
  napcatReconnectDelay: number;
  napcatGroupDelay: number;
  napcatIntraGroupDelay: number;
};

export type MaskedConfig = Omit<WorkerConfig, "secret" | "napcatToken"> & {
  secret: string;
  napcatToken: string;
};

export const DEFAULT_CONFIG: WorkerConfig = {
  elyhubBaseUrl: "http://127.0.0.1:3000",
  secret: "",
  heartbeatInterval: 60,
  syncCron: "0 0 * * *",
  napcatHost: "127.0.0.1",
  napcatPort: 13001,
  napcatToken: "",
  napcatReconnectAttempts: 5,
  napcatReconnectDelay: 3000,
  napcatGroupDelay: 500,
  napcatIntraGroupDelay: 300,
};

export function maskToken(raw: string): string {
  if (!raw) return "";
  const prefixMatch = raw.match(/^[a-z]{2,4}-/i);
  const prefix = prefixMatch?.[0] ?? raw.slice(0, 2);
  const tail = raw.length > 4 ? raw.slice(-4) : raw;
  return `${prefix}****${tail}`;
}

export function toMaskedConfig(config: WorkerConfig): MaskedConfig {
  return {
    ...config,
    secret: maskToken(config.secret),
    napcatToken: maskToken(config.napcatToken),
  };
}

export type ConfigSubscriber = (config: WorkerConfig) => void | Promise<void>;
