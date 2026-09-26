"use client";

import { ModuleErrorBoundary } from "@/components/ErrorState";

/** Reports module boundary (V1-HARDEN-1) — the Reports hub and every report route (native
 * ERPNext Query/Script Reports run via `runReport()`) inherit this. */
export default function ReportsError({
  error,
  retry,
  reset,
}: {
  error: Error & { digest?: string };
  retry?: () => void;
  reset: () => void;
}) {
  return <ModuleErrorBoundary error={error} retry={retry} reset={reset} moduleLabel="Reports" homeHref="/reports" />;
}
