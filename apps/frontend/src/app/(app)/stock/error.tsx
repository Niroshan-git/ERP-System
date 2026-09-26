"use client";

import { ModuleErrorBoundary } from "@/components/ErrorState";

/** Inventory/Stock module boundary (V1-HARDEN-1) — Warehouses/Batches/Serial Nos/Stock
 * Entry/Stock Balance all inherit this. */
export default function StockError({
  error,
  retry,
  reset,
}: {
  error: Error & { digest?: string };
  retry?: () => void;
  reset: () => void;
}) {
  return <ModuleErrorBoundary error={error} retry={retry} reset={reset} moduleLabel="Inventory" homeHref="/stock" />;
}
