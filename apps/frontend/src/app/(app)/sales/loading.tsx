import { PageSkeleton } from "@/components/LoadingSkeleton";

/** Route-level loading boundary for Sales (V1-HARDEN-1, mission §12) — covers every Sales
 * route without a more specific `loading.tsx` of its own. */
export default function SalesLoading() {
  return <PageSkeleton variant="table" />;
}
