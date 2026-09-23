import "server-only";
import { appendFile, mkdir } from "fs/promises";
import path from "path";

/**
 * Dev-only error log — appends structured JSON lines to apps/frontend/logs/error.log so
 * ERPNext API failures can be tailed while developing (`Get-Content logs/error.log -Wait`
 * / `tail -f logs/error.log`). Skipped in production: Vercel's filesystem is ephemeral and
 * not shared across serverless invocations, so a file written there wouldn't be tail-able
 * anyway — production errors go to console.error instead, which Vercel captures in its
 * own function logs.
 */

const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "error.log");
const IS_DEV = process.env.NODE_ENV !== "production";

export type ErrorLogEntry = {
  /** Where the error came from, e.g. "erpnextFetch" or a server action name. */
  source: string;
  message: string;
  status?: number;
  path?: string;
  detail?: string;
  /** Ceylon Stack correlation ID (see lib/correlationId.ts) — lets this dev-only tail log be
   * cross-referenced with the same failure's native Error Log entry (trace_id) once
   * lib/observability.ts's report reaches ERPNext. */
  correlationId?: string;
};

let dirReady: Promise<void> | null = null;

async function ensureDir() {
  if (!dirReady) dirReady = mkdir(LOG_DIR, { recursive: true }).then(() => undefined);
  return dirReady;
}

export function logError(entry: ErrorLogEntry): void {
  const line = { time: new Date().toISOString(), ...entry };

  if (!IS_DEV) {
    console.error("[erpnext]", line);
    return;
  }

  ensureDir()
    .then(() => appendFile(LOG_FILE, JSON.stringify(line) + "\n", "utf8"))
    .catch((err) => {
      // Logging must never break the request it's logging about.
      console.error("[erpnext] failed to write error log:", err);
      console.error("[erpnext]", line);
    });
}
