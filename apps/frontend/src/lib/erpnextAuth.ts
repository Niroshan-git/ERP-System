import "server-only";

/**
 * Split out of erpnext.ts so lib/observability.ts can authenticate to ERPNext directly
 * without importing erpnext.ts itself (erpnext.ts imports reportOperation() from
 * observability.ts for its own error-path instrumentation — a two-way import here would be
 * circular).
 */
export const BASE_URL = process.env.ERPNEXT_URL;

/** All data calls run as the "Frontend Integration" service account — see apps/frontend/README.md. */
export function serviceAuthHeader(): string {
  const key = process.env.ERPNEXT_API_KEY;
  const secret = process.env.ERPNEXT_API_SECRET;
  if (!BASE_URL || !key || !secret) {
    throw new Error(
      "ERPNext connection is not configured — set ERPNEXT_URL, ERPNEXT_API_KEY and ERPNEXT_API_SECRET in apps/frontend/.env.local",
    );
  }
  return `token ${key}:${secret}`;
}
