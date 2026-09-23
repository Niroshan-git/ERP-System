/** Short "time ago" label for the Overview's recent-events feed — not a full i18n solution,
 * matching this codebase's existing locale-agnostic `toLocaleString`-based approach
 * (`lib/format.ts`) rather than inventing a formatting convention for this screen alone. */
export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function formatClockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/** Builds the safe, copyable support-summary text for a trace (mission §22) — every field
 * here already exists on the `Trace`'s own safe surface (never anything from
 * `TechnicalDetails`), so this never risks leaking gated diagnostic content into a
 * clipboard action. */
export function buildSupportSummary(trace: {
  correlationId: string;
  occurredAt: string;
  module: string;
  operation: string;
  referenceDoctype?: string;
  referenceName?: string;
  actor: { fullName: string; email: string } | null;
  userSafeMessage: string;
}): string {
  const lines = [
    `Trace: ${trace.correlationId}`,
    `Time: ${new Date(trace.occurredAt).toLocaleString()}`,
    `Module: ${trace.module}`,
    `Operation: ${trace.operation}`,
  ];
  if (trace.referenceName) {
    lines.push(`Document: ${trace.referenceName}${trace.referenceDoctype ? ` (${trace.referenceDoctype})` : ""}`);
  }
  lines.push(`Actor: ${trace.actor ? `${trace.actor.fullName} <${trace.actor.email}>` : "Unknown"}`);
  lines.push(`Error: ${trace.userSafeMessage}`);
  return lines.join("\n");
}
