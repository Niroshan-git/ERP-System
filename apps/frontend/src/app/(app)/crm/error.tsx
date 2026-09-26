"use client";

import { ModuleErrorBoundary } from "@/components/ErrorState";

/** CRM module boundary (V1-HARDEN-1) — Leads/Opportunities/Activities/Pipeline all inherit
 * this. */
export default function CrmError({
  error,
  retry,
  reset,
}: {
  error: Error & { digest?: string };
  retry?: () => void;
  reset: () => void;
}) {
  return <ModuleErrorBoundary error={error} retry={retry} reset={reset} moduleLabel="CRM" homeHref="/crm" />;
}
