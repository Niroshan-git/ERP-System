"use client";

import { ModuleErrorBoundary } from "@/components/ErrorState";

/** Buying module boundary (V1-HARDEN-1) — Material Request/RFQ/Supplier Quotation/Purchase
 * Order/Purchase Receipt/Purchase Invoice all inherit this. */
export default function BuyingError({
  error,
  retry,
  reset,
}: {
  error: Error & { digest?: string };
  retry?: () => void;
  reset: () => void;
}) {
  return <ModuleErrorBoundary error={error} retry={retry} reset={reset} moduleLabel="Buying" homeHref="/buying" />;
}
