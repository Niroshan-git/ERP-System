import { PageSkeleton } from "@/components/LoadingSkeleton";

/** Route-level loading boundary for Buying (V1-HARDEN-1, mission §12). */
export default function BuyingLoading() {
  return <PageSkeleton variant="table" />;
}
