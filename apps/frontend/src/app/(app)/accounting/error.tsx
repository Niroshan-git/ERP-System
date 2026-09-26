"use client";

import { ModuleErrorBoundary } from "@/components/ErrorState";

/** Finance/Accounting module boundary (V1-HARDEN-1) — Chart of Accounts/Bank Accounts/Account
 * Determination/Finance Reports all inherit this. Purely additive resilience — does not touch
 * any Finance business rule or the FIN-2 authorization gate. */
export default function AccountingError({
  error,
  retry,
  reset,
}: {
  error: Error & { digest?: string };
  retry?: () => void;
  reset: () => void;
}) {
  return <ModuleErrorBoundary error={error} retry={retry} reset={reset} moduleLabel="Finance" homeHref="/accounting" />;
}
