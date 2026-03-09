/**
 * Observability: structured logs, request context.
 * X-Request-ID set by middleware for API routes.
 */

export type LogLevel = "info" | "warn" | "error";

export interface StructuredLog {
  ts: string;
  level: LogLevel;
  msg: string;
  request_id?: string;
  job_id?: string;
  [key: string]: unknown;
}

function formatLog(level: LogLevel, msg: string, meta?: Record<string, unknown>): string {
  const entry: StructuredLog = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...meta,
  };
  return JSON.stringify(entry);
}

export function logInfo(msg: string, meta?: Record<string, unknown>): void {
  console.log(formatLog("info", msg, meta));
}

export function logWarn(msg: string, meta?: Record<string, unknown>): void {
  console.warn(formatLog("warn", msg, meta));
}

export function logError(msg: string, meta?: Record<string, unknown>): void {
  console.error(formatLog("error", msg, meta));
}
