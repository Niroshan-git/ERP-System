import "server-only";

/**
 * Ceylon Stack's request-correlation ID: CS-YYMMDD-XXXXXX (UTC date + 6 hex chars from
 * crypto.randomUUID()). Generated server-side only — see docs/observability-architecture.md's
 * "Correlation ID design" section for why inbound client-supplied IDs are never trusted.
 */
const FORMAT = /^CS-\d{6}-[0-9A-F]{6}$/;

export function generateCorrelationId(): string {
  return `CS-${utcYyMmDd(new Date())}-${randomSuffix()}`;
}

export function isValidCorrelationId(value: unknown): value is string {
  return typeof value === "string" && FORMAT.test(value);
}

function randomSuffix(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
}

function utcYyMmDd(date: Date): string {
  const yy = String(date.getUTCFullYear() % 100).padStart(2, "0");
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}
