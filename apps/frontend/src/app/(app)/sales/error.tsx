"use client";

import { ModuleErrorBoundary } from "@/components/ErrorState";

/** Sales module boundary (V1-HARDEN-1) — Quotation/Sales Order/Delivery Note/Sales
 * Invoice/Pick List/Returns all inherit this instead of crashing to a raw Next.js error page. */
export default function SalesError({
  error,
  retry,
  reset,
}: {
  error: Error & { digest?: string };
  retry?: () => void;
  reset: () => void;
}) {
  return <ModuleErrorBoundary error={error} retry={retry} reset={reset} moduleLabel="Sales" homeHref="/sales" />;
}
