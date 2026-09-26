import { PageSkeleton } from "@/components/LoadingSkeleton";

/** Route-level loading boundary for Reports (V1-HARDEN-1, mission §12). */
export default function ReportsLoading() {
  return <PageSkeleton variant="table" />;
}
