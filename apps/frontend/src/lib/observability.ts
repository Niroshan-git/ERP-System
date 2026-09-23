import "server-only";
import { BASE_URL, serviceAuthHeader } from "./erpnextAuth";
import { generateCorrelationId, isValidCorrelationId } from "./correlationId";
import { redactString } from "./redact";
import type { ActorContext } from "./actorContext";

export type Severity = "INFO" | "WARNING" | "ERROR" | "CRITICAL";

export type ReportOperationArgs = {
  /** Reuse an ID already generated for this operation (e.g. by erpnextFetch) so the write
   * call and its follow-up report share one trace. Falls back to a fresh one if omitted or
   * malformed — never trusts an arbitrary caller-supplied string as-is. */
  correlationId?: string;
  actor?: ActorContext | null;
  severity: Severity;
  /** Human-readable business operation, e.g. "submit Work Order" — becomes Activity Log's
   * subject. Omit for pure error telemetry with no associated business action. */
  operation?: string;
  referenceDoctype?: string;
  referenceName?: string;
  message?: string;
  detail?: string;
};

export type ReportOperationResult = { correlationId: string; recorded: boolean };

/**
 * Reports one observability event to smart_factory's log_operation whitelisted method, which
 * writes to native Error Log / Activity Log under the real actor's identity (see
 * apps/smart_factory/smart_factory/api/observability.py).
 *
 * Never throws — a telemetry failure must not become the business operation's failure (see
 * docs/observability-architecture.md's failure/degradation behavior note). Deliberately does
 * NOT go through erpnextFetch()/lib/erpnext.ts: that module's own error path calls this
 * function, so importing it back would create a circular import, and keeping this path
 * structurally separate also means a failure reporting *to* this endpoint can never trigger
 * another call *to* this endpoint.
 */
export async function reportOperation(args: ReportOperationArgs): Promise<ReportOperationResult> {
  const correlationId = isValidCorrelationId(args.correlationId) ? args.correlationId : generateCorrelationId();

  try {
    const res = await fetch(`${BASE_URL}/api/method/smart_factory.api.observability.log_operation`, {
      method: "POST",
      headers: {
        Authorization: serviceAuthHeader(),
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        correlation_id: correlationId,
        actor_email: args.actor?.email,
        actor_full_name: args.actor?.fullName,
        severity: args.severity,
        operation: args.operation,
        reference_doctype: args.referenceDoctype,
        reference_name: args.referenceName,
        message: args.message ? redactString(args.message) : undefined,
        detail: args.detail ? redactString(args.detail) : undefined,
      }),
    });
    return { correlationId, recorded: res.ok };
  } catch (err) {
    console.error("[observability] reportOperation failed:", err instanceof Error ? err.message : err);
    return { correlationId, recorded: false };
  }
}
