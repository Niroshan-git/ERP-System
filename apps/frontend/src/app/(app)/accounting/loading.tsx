import { PageSkeleton } from "@/components/LoadingSkeleton";

/** Route-level loading boundary for Finance/Accounting (V1-HARDEN-1, mission §12). */
export default function AccountingLoading() {
  return <PageSkeleton variant="table" />;
}
