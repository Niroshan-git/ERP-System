"use client";

import { ModuleErrorBoundary } from "@/components/ErrorState";

/**
 * Admin/Observability module boundary (V1-HARDEN-1). No module-level `loading.tsx` alongside
 * this one — `admin/observability/*` already has five route-specific `loading.tsx` files
 * (O-7/O-9 era) covering the actual content; this only adds the error boundary that was
 * missing everywhere in the app before this package.
 */
export default function AdminError({
  error,
  retry,
  reset,
}: {
  error: Error & { digest?: string };
  retry?: () => void;
  reset: () => void;
}) {
  return <ModuleErrorBoundary error={error} retry={retry} reset={reset} moduleLabel="Admin" homeHref="/admin/observability" />;
}
