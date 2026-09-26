"use client";

import { ModuleErrorBoundary } from "@/components/ErrorState";

/** Manufacturing module boundary (V1-HARDEN-1) — Work Orders/Material Transfer/Complete
 * Production/Job Cards/BOM/Production Plan all inherit this. Purely additive resilience —
 * does not touch Manufacturing's frozen V1 boundary or any business logic (CLAUDE.md Current
 * Mission lock). */
export default function ManufacturingError({
  error,
  retry,
  reset,
}: {
  error: Error & { digest?: string };
  retry?: () => void;
  reset: () => void;
}) {
  return (
    <ModuleErrorBoundary error={error} retry={retry} reset={reset} moduleLabel="Manufacturing" homeHref="/manufacturing" />
  );
}
