/**
 * Ceylon Stack's application-wide error taxonomy (V1-HARDEN-1, mission §6/§14).
 *
 * Deliberately framework-agnostic (no `"server-only"` import) so it can run in three
 * different contexts without any special-casing:
 *   1. Server Components / Server Actions, classifying a real `ErpNextError` thrown by
 *      `lib/erpnext.ts` (via `toAppError()`, which has access to `.status`/`.correlationId`).
 *   2. Client error boundaries (`error.tsx`/`global-error.tsx`), classifying whatever Next.js
 *      hands them after its own RSC error sanitization (via `classifyBoundaryError()`, which
 *      only ever sees `.message`/`.digest` — see the doc comment on that function for why).
 *   3. Vitest unit tests, with no Next.js/React runtime at all.
 *
 * This does NOT introduce a competing error-reporting system — it only classifies and
 * produces safe copy. Actual telemetry (Error Log / Activity Log / correlation IDs) stays
 * exactly where it already lives: `lib/erpnext.ts` → `lib/observability.ts` → smart_factory's
 * `log_operation`. See `docs/architecture/runtime-resilience.md` for the full picture.
 */

export type AppErrorCode =
  | "AUTH_REQUIRED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "ERP_UNAVAILABLE"
  | "TIMEOUT"
  | "NETWORK_ERROR"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "UNKNOWN";

export type AppError = {
  code: AppErrorCode;
  /** Internal/diagnostic detail — safe for server logs, must NEVER be rendered verbatim in UI. */
  message: string;
  /** Safe, human-readable copy — the only thing UI is allowed to show for this error. */
  userMessage: string;
  status?: number;
  /** Ceylon Stack correlation ID (`CS-YYMMDD-XXXXXX`) or, for a boundary-caught error with no
   * such ID available, Next.js's own auto-generated `error.digest` — both are safe to display
   * as a support reference (see the doc comment on `classifyBoundaryError`). */
  correlationId?: string;
  /** Whether a plain retry (re-fetch/re-render, no resubmission of user input) is reasonable. */
  retryable: boolean;
};

/**
 * Curated, safe copy per error code — the ONLY strings the UI is allowed to render for an
 * error. Never interpolates raw backend text here (mission §7/§9). The one deliberate
 * exception (`VALIDATION_ERROR`/`CONFLICT` optionally carrying `erpnextMessage`) is handled by
 * the caller in `toAppError()`, not here — see its comment.
 */
const SAFE_MESSAGES: Record<AppErrorCode, string> = {
  AUTH_REQUIRED: "Your session has expired. Please sign in again.",
  FORBIDDEN: "You don't have permission to access this information.",
  VALIDATION_ERROR: "ERPNext rejected this request — check the required fields and try again.",
  NOT_FOUND: "The requested record could not be found.",
  CONFLICT: "This record has already changed or conflicts with an existing one.",
  ERP_UNAVAILABLE: "ERP service temporarily unavailable. We couldn't retrieve this information right now.",
  TIMEOUT: "The request took too long to respond. Please try again.",
  NETWORK_ERROR: "Couldn't reach the ERP service. Check your connection and try again.",
  RATE_LIMITED: "Too many requests right now — please wait a moment and try again.",
  INTERNAL_ERROR: "Something went wrong on our side while handling this request.",
  UNKNOWN: "We couldn't complete this request. This is usually temporary — try again, or contact support if it continues.",
};

/** GET/read failures are safe to retry; a failed write must never be silently retried (mission §10). */
const RETRYABLE: Record<AppErrorCode, boolean> = {
  AUTH_REQUIRED: false,
  FORBIDDEN: false,
  VALIDATION_ERROR: false,
  NOT_FOUND: false,
  CONFLICT: false,
  ERP_UNAVAILABLE: true,
  TIMEOUT: true,
  NETWORK_ERROR: true,
  RATE_LIMITED: true,
  INTERNAL_ERROR: true,
  UNKNOWN: true,
};

/** Maps an HTTP-ish status code (as carried by `ErpNextError.status`, including this app's
 * own `0` sentinel for a network-level failure — see `erpnextFetch`'s catch block) to a code. */
export function classifyStatus(status: number): AppErrorCode {
  if (status === 0) return "NETWORK_ERROR";
  if (status === 401) return "AUTH_REQUIRED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 417 || status === 422) return "VALIDATION_ERROR";
  if (status === 429) return "RATE_LIMITED";
  if (status === 408) return "TIMEOUT";
  if (status >= 500) return "ERP_UNAVAILABLE";
  return "UNKNOWN";
}

/** Structural check for `ErpNextError` (see `lib/erpnext.ts`) without importing that
 * `"server-only"`-guarded module here — this file must stay importable from `error.tsx`
 * client boundaries too, and a real `ErpNextError` instance never survives the RSC
 * serialization boundary anyway (see `classifyBoundaryError`'s comment), so an `instanceof`
 * check would silently fail there even if the import were allowed. */
function isErpNextErrorShape(
  error: unknown,
): error is { status: number; correlationId: string; erpnextMessage?: string; message: string } {
  return (
    !!error &&
    typeof error === "object" &&
    "status" in error &&
    typeof (error as { status: unknown }).status === "number" &&
    "correlationId" in error &&
    typeof (error as { correlationId: unknown }).correlationId === "string"
  );
}

/**
 * Server-side normalization (mission §6/§14) — call this in Server Components/Server Actions
 * against a real caught error (typically an `ErpNextError` from `lib/erpnext.ts`) BEFORE
 * deciding whether to `notFound()`, render an inline safe state, or let it rethrow to the
 * nearest `error.tsx` boundary. This is the one place classification has real information
 * (`.status`, `.correlationId`, ERPNext's own validation text) — use it here, not by trying to
 * parse a message that's already been sanitized by the time a boundary sees it.
 */
export function toAppError(error: unknown): AppError {
  if (isErpNextErrorShape(error)) {
    const code = classifyStatus(error.status);
    // ERPNext's own frappe.throw() validation text (already HTML-stripped by
    // extractErpNextMessage in lib/erpnext.ts) is developer-authored, user-facing business
    // copy — safe to show directly for the two codes where "what exactly was wrong" is the
    // whole point (matches every existing per-action `humanizeError()` convention already in
    // this codebase, e.g. sales/orders/actions.ts). Every other code always uses the curated
    // safe copy, never raw backend text.
    const showErpMessage = code === "VALIDATION_ERROR" || code === "CONFLICT";
    return {
      code,
      message: error.message,
      userMessage: (showErpMessage && error.erpnextMessage) || SAFE_MESSAGES[code],
      status: error.status,
      correlationId: error.correlationId,
      retryable: RETRYABLE[code],
    };
  }

  if (error instanceof Error) {
    const lower = error.message.toLowerCase();
    let code: AppErrorCode = "INTERNAL_ERROR";
    if (lower.includes("timed out") || lower.includes("timeout")) code = "TIMEOUT";
    else if (
      lower.includes("econnrefused") ||
      lower.includes("fetch failed") ||
      lower.includes("enotfound") ||
      lower.includes("network")
    )
      code = "NETWORK_ERROR";

    return {
      code,
      message: error.message,
      userMessage: SAFE_MESSAGES[code],
      retryable: RETRYABLE[code],
    };
  }

  return {
    code: "UNKNOWN",
    message: typeof error === "string" ? error : "non-Error value thrown",
    userMessage: SAFE_MESSAGES.UNKNOWN,
    retryable: true,
  };
}

/**
 * Client-side, boundary-safe classification for `error.tsx`/`global-error.tsx`.
 *
 * Next.js 16's own RSC error handling (verified against
 * `node_modules/next/dist/server/app-render/create-error-handler.js` and
 * `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md`) replaces
 * a Server Component's thrown error with a **generic message + `.digest`** before it ever
 * reaches this boundary in production — this is Next's own defense against leaking backend
 * internals (mission §7's requirement, enforced one layer below this file). Practically, that
 * means:
 *   - In development, `.message` is the real thrown message — classification below can use it.
 *   - In production, `.message` is Next's generic placeholder — none of the patterns below
 *     will match, and this intentionally falls back to `INTERNAL_ERROR`'s honest, non-specific
 *     copy rather than guessing a more specific (and unverifiable) code from nothing.
 *   - `.digest` DOES reliably survive, in both dev and prod, and — because
 *     `lib/erpnext.ts`'s `ErpNextError` now sets `this.digest = correlationId` before throwing
 *     (V1-HARDEN-1) — Next.js preserves it unchanged rather than regenerating a hash (see
 *     `create-error-handler.js` line ~81: "If the error already has a digest, respect the
 *     original digest"). So a failure that originated in `erpnextFetch()` still surfaces its
 *     real Ceylon Stack correlation ID here, cross-referenceable with Error Log/Activity Log/
 *     the Trace Explorer — a failure that originated elsewhere (a genuine render bug) instead
 *     surfaces Next's own auto-generated digest, which is still a safe, stable support
 *     reference even though it won't resolve in the Trace Explorer.
 */
export function classifyBoundaryError(error: Error & { digest?: string }): AppError {
  const message = error.message || "";
  const lower = message.toLowerCase();
  let code: AppErrorCode = "INTERNAL_ERROR";

  if (lower.includes("econnrefused") || lower.includes("fetch failed") || lower.includes("enotfound") || lower.includes("network error")) {
    code = "NETWORK_ERROR";
  } else if (lower.includes("timed out") || lower.includes("timeout")) {
    code = "TIMEOUT";
  } else if (/\berpnext 401\b/i.test(message)) {
    code = "AUTH_REQUIRED";
  } else if (/\berpnext 403\b/i.test(message)) {
    code = "FORBIDDEN";
  } else if (/\berpnext 404\b/i.test(message)) {
    code = "NOT_FOUND";
  } else if (/\berpnext 409\b/i.test(message)) {
    code = "CONFLICT";
  } else if (/\berpnext 429\b/i.test(message)) {
    code = "RATE_LIMITED";
  } else if (/\berpnext (5\d\d)\b/i.test(message)) {
    code = "ERP_UNAVAILABLE";
  } else {
    // No recognizable pattern (the normal production case, per this function's doc comment
    // above) — UNKNOWN's copy is deliberately written to cover "this is very likely an
    // ERPNext connectivity problem, but we can't prove it from here" without overclaiming a
    // specific cause we can't actually verify in production.
    code = "UNKNOWN";
  }

  return {
    code,
    message,
    userMessage: SAFE_MESSAGES[code],
    correlationId: typeof error.digest === "string" && error.digest.length > 0 ? error.digest : undefined,
    retryable: RETRYABLE[code],
  };
}

export function safeMessageFor(code: AppErrorCode): string {
  return SAFE_MESSAGES[code];
}

export function isRetryable(code: AppErrorCode): boolean {
  return RETRYABLE[code];
}
