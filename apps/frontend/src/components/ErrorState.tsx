"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  Home,
  Lock,
  RefreshCw,
  SearchX,
  ShieldAlert,
  WifiOff,
} from "lucide-react";
import type { AppError, AppErrorCode } from "@/lib/appError";
import { classifyBoundaryError } from "@/lib/appError";
import { TraceIdBadge } from "@/components/TraceIdBadge";
import { reportClientRenderError } from "@/lib/actions/clientErrorReport";

/**
 * Reusable runtime-resilience error UI (V1-HARDEN-1, mission §8/§9). One component, reused by:
 *   - `ModuleErrorBoundary` below, wired directly into every module's `error.tsx`
 *   - `(app)/error.tsx` (application-shell boundary)
 *   - `global-error.tsx` (root boundary — via its own minimal shell, not this component
 *     directly, since that file must render its own `<html>`/`<body>`)
 *   - any page that wants an inline (non-thrown) safe error state for a classifiable
 *     condition — see `toAppError()` in lib/appError.ts and this file's `InlineErrorState`.
 *
 * Deliberately renders ONLY `appError.userMessage` — never `appError.message` (the internal/
 * diagnostic string) — see lib/appError.ts's doc comment on why that split exists (mission §7).
 */

const TITLES: Record<AppErrorCode, string> = {
  AUTH_REQUIRED: "Session expired",
  FORBIDDEN: "Access denied",
  VALIDATION_ERROR: "Couldn't save",
  NOT_FOUND: "Not found",
  CONFLICT: "Conflict",
  ERP_UNAVAILABLE: "ERP service unavailable",
  TIMEOUT: "Request timed out",
  NETWORK_ERROR: "Connection problem",
  RATE_LIMITED: "Too many requests",
  INTERNAL_ERROR: "Something went wrong",
  UNKNOWN: "Something went wrong",
};

const ICONS: Record<AppErrorCode, typeof AlertTriangle> = {
  AUTH_REQUIRED: Lock,
  FORBIDDEN: ShieldAlert,
  VALIDATION_ERROR: AlertTriangle,
  NOT_FOUND: SearchX,
  CONFLICT: AlertTriangle,
  ERP_UNAVAILABLE: WifiOff,
  TIMEOUT: Clock,
  NETWORK_ERROR: WifiOff,
  RATE_LIMITED: Clock,
  INTERNAL_ERROR: AlertTriangle,
  UNKNOWN: AlertTriangle,
};

export function ErrorState({
  appError,
  onRetry,
  homeHref = "/",
  homeLabel = "Back to dashboard",
  variant = "page",
}: {
  appError: AppError;
  onRetry?: () => void;
  homeHref?: string;
  homeLabel?: string;
  /** "page" fills the module's content area with generous padding; "inline" is compact enough
   * to sit inside an existing card/panel without dominating the page. */
  variant?: "page" | "inline";
}) {
  const Icon = ICONS[appError.code];
  const title = TITLES[appError.code];

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={
        variant === "page"
          ? "flex min-h-[50vh] items-center justify-center px-6 py-12"
          : "rounded-xl border border-border bg-surface p-6"
      }
    >
      <div className={variant === "page" ? "w-full max-w-md text-center" : "flex items-start gap-3"}>
        <div className={variant === "page" ? "mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-alert/10" : "mt-0.5 shrink-0"}>
          <Icon size={variant === "page" ? 24 : 20} className="text-alert" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-graphite-900">{title}</h2>
          <p className="mt-1 text-sm text-graphite-500">{appError.userMessage}</p>

          {appError.correlationId && (
            <div className={variant === "page" ? "mt-4 flex justify-center" : "mt-3"}>
              <TraceIdBadge
                correlationId={appError.correlationId}
                openHref={`/admin/observability/traces/${encodeURIComponent(appError.correlationId)}`}
              />
            </div>
          )}

          <div className={`mt-5 flex ${variant === "page" ? "justify-center" : ""} flex-wrap gap-3`}>
            {onRetry && appError.retryable && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
              >
                <RefreshCw size={14} aria-hidden="true" />
                Try again
              </button>
            )}
            <Link
              href={homeHref}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-sm font-medium text-graphite-900 hover:bg-graphite-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
            >
              <Home size={14} aria-hidden="true" />
              {homeLabel}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Direct default-export shape for a route's `error.tsx` (mission §8's
 * `<ModuleErrorState error={error} reset={reset} />` sketch, adapted to this codebase's actual
 * `ErrorState` naming and to Next.js 16.3's stable `retry` prop — see error.tsx's own file
 * comment for why `retry` is preferred over `reset` here). Keeps every route's own `error.tsx`
 * to a ~6-line wrapper (mission §8: "DO NOT create duplicate 100-line error.tsx files").
 *
 * Reports the failure to Observability client-side (mission §13) — this is the one runtime
 * path NOT already covered by `lib/erpnext.ts`'s own server-side `scheduleFailureReport()`:
 * a genuine render-time bug (not an ERPNext call failure) never touches `erpnextFetch()` at
 * all, so without this it would be invisible to Error Log/Activity Log. Fire-and-forget, never
 * blocks rendering the fallback UI, and explicitly skipped when `appError.correlationId` is
 * already a Ceylon Stack correlation ID (i.e. the failure already has an Error Log entry from
 * `erpnextFetch()` itself — reporting it a second time would just duplicate that entry).
 */
export function ModuleErrorBoundary({
  error,
  retry,
  reset,
  moduleLabel,
  homeHref,
}: {
  error: Error & { digest?: string };
  retry?: () => void;
  reset?: () => void;
  moduleLabel: string;
  homeHref: string;
}) {
  const appError = classifyBoundaryError(error);
  const alreadyReported = /^CS-\d{6}-[0-9A-F]{6}$/.test(appError.correlationId ?? "");

  useEffect(() => {
    if (alreadyReported) return;
    reportClientRenderError({
      moduleLabel,
      digest: error.digest,
      message: appError.message,
      code: appError.code,
    }).catch(() => {
      // Telemetry must never surface as a second failure on top of the one already shown.
    });
    // Intentionally runs once per mounted boundary instance (a fresh `error` object), not on
    // every render — re-running per keystroke/re-render isn't the goal here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error.digest]);

  return (
    <ErrorState
      appError={appError}
      onRetry={retry ?? reset}
      homeHref={homeHref}
      homeLabel={`Back to ${moduleLabel}`}
      variant="page"
    />
  );
}

/** For pages that classify an expected, caught error inline (mission §6/§9's "differentiated
 * presentation" ask) instead of letting it bubble to the route's `error.tsx` boundary — e.g. a
 * 403 the page already knows how to explain without losing its own layout/breadcrumb. See
 * `lib/appError.ts`'s `toAppError()`. */
export function InlineErrorState({ appError, homeHref }: { appError: AppError; homeHref?: string }) {
  return <ErrorState appError={appError} homeHref={homeHref} variant="inline" />;
}
