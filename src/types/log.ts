export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogEntry = {
  id: number;
  ts: string;
  level: LogLevel;
  module: string;
  message: string;
};

export type LogSubscriber = (entry: LogEntry) => void;
