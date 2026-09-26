"use client";

import { ModuleErrorBoundary } from "@/components/ErrorState";

/** Master Data module boundary (V1-HARDEN-1) — Items/Item Groups/Customers/Suppliers/
 * Warehouses/BOMs/Price Lists/Territories/Contacts/Addresses all inherit this. */
export default function MasterDataError({
  error,
  retry,
  reset,
}: {
  error: Error & { digest?: string };
  retry?: () => void;
  reset: () => void;
}) {
  return (
    <ModuleErrorBoundary error={error} retry={retry} reset={reset} moduleLabel="Master Data" homeHref="/master-data" />
  );
}
