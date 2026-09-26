import { PageSkeleton } from "@/components/LoadingSkeleton";

/** Route-level loading boundary for Master Data (V1-HARDEN-1, mission §12). */
export default function MasterDataLoading() {
  return <PageSkeleton variant="table" />;
}
