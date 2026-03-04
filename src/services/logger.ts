import pino, { type Logger } from "pino";
import type { LogEntry, LogLevel, LogSubscriber } from "../types/log";

const RING_CAPACITY = 500;

class RingSink {
  private readonly buf: LogEntry[] = [];
  private readonly subs = new Set<LogSubscriber>();
  private seq = 0;

  append(level: LogLevel, module: string, message: string): void {
    const entry: LogEntry = {
      id: ++this.seq,
      ts: new Date().toISOString(),
      level,
      module,
      message,
    };
    this.buf.push(entry);
    if (this.buf.length > RING_CAPACITY) this.buf.shift();
    for (const sub of this.subs) sub(entry);
  }

  list(): LogEntry[] {
    return [...this.buf];
  }

  subscribe(subscriber: LogSubscriber): () => void {
    this.subs.add(subscriber);
    return () => this.subs.delete(subscriber);
  }
}

function extractMessage(args: unknown[]): string {
  // pino pattern: logger.warn({ context }, "message")
  if (typeof args[1] === "string") {
    const ctx = args[0];
    if (ctx && typeof ctx === "object") {
      const err = (ctx as Record<string, unknown>).err;
      if (err instanceof Error) return `${args[1]}: ${err.message}`;
    }
    return args[1];
  }
  if (typeof args[0] === "string") return args[0];
  if (args[0] instanceof Error) return args[0].message;
  if (args[0] && typeof args[0] === "object") {
    try {
      return JSON.stringify(args[0]);
    } catch {
      return String(args[0]);
    }
  }
  return "";
}

export const ringSink = new RingSink();

const isDev = process.env.NODE_ENV !== "production";

export const rootLogger = pino({
  name: "elyhub-qq-worker",
  level: process.env.LOG_LEVEL ?? "info",
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(isDev && {
    transport: {
      target: "pino-pretty",
      options: { colorize: true, translateTime: "HH:MM:ss", ignore: "name" },
    },
  }),
});

type LoggerOpts = { level?: LogLevel };

export function createLogger(scope: string, opts?: LoggerOpts): Logger {
  const child = rootLogger.child({ module: scope });
  if (opts?.level) child.level = opts.level;

  const wrap = (level: LogLevel) => {
    const original = (child[level] as (...a: unknown[]) => void).bind(child);
    return (...args: unknown[]) => {
      original(...args);
      ringSink.append(level, scope, extractMessage(args));
    };
  };

  (child as unknown as Record<string, unknown>).debug = wrap("debug");
  (child as unknown as Record<string, unknown>).info = wrap("info");
  (child as unknown as Record<string, unknown>).warn = wrap("warn");
  (child as unknown as Record<string, unknown>).error = wrap("error");

  return child;
}

export function getRecentLogs(): LogEntry[] {
  return ringSink.list();
}

export function subscribeLogs(subscriber: LogSubscriber): () => void {
  return ringSink.subscribe(subscriber);
}
