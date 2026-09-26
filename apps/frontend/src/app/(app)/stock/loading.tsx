import { PageSkeleton } from "@/components/LoadingSkeleton";

/** Route-level loading boundary for Inventory/Stock (V1-HARDEN-1, mission §12). */
export default function StockLoading() {
  return <PageSkeleton variant="table" />;
}
