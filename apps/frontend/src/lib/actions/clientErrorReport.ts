"use server";

import { getActorContext } from "@/lib/actorContext";
import { reportOperation } from "@/lib/observability";
import { redactString } from "@/lib/redact";
import type { AppErrorCode } from "@/lib/appError";

/**
 * V1-HARDEN-1 (mission §13): the one gap `lib/erpnext.ts`'s existing server-side
 * `scheduleFailureReport()` can't cover — a genuine client-side render error (a bug in a
 * `"use client"` component, not an ERPNext call failure) never touches `erpnextFetch()`, so
 * without this it would be invisible to Error Log/Activity Log. Called from
 * `ModuleErrorBoundary` (components/ErrorState.tsx) once per mounted error boundary.
 *
 * Deliberately a thin, explicit-allowlist wrapper around the existing `reportOperation()` —
 * NOT a new logging/telemetry system (mission §24's "do not create another Observability
 * subsystem"). Reuses the same correlation ID / actor / redaction pipeline every other write
 * in this app already goes through.
 *
 * Never throws: a telemetry failure must never surface as a second error on top of the one
 * already being shown to the user (same contract as `reportOperation()` itself).
 */
export async function reportClientRenderError(args: {
  moduleLabel: string;
  /** Next.js's own `error.digest` — may already be a Ceylon Stack correlation ID (when the
   * underlying failure was an `ErpNextError`) or Next's own auto-generated hash (a genuine
   * render bug) — see `lib/appError.ts`'s `classifyBoundaryError()` doc comment. */
  digest?: string;
  /** Dev-only diagnostic message (empty/generic in production per Next's own RSC
   * sanitization) — redacted before leaving this process, same as every other free-text field
   * `reportOperation()` accepts. */
  message: string;
  code: AppErrorCode;
}): Promise<void> {
  try {
    const actor = await getActorContext();
    await reportOperation({
      correlationId: args.digest,
      actor,
      severity: "ERROR",
      operation: `client render error in ${args.moduleLabel}`,
      message: `[${args.code}] boundary caught a client-side render error`,
      detail: redactString(args.message).slice(0, 500),
      recordActivity: false,
    });
  } catch {
    // Telemetry must never surface as a second failure on top of the one already shown.
  }
}
