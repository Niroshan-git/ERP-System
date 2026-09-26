import { PageSkeleton } from "@/components/LoadingSkeleton";

/** Route-level loading boundary for Manufacturing (V1-HARDEN-1, mission §12). */
export default function ManufacturingLoading() {
  return <PageSkeleton variant="table" />;
}
