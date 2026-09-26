import { PageSkeleton } from "@/components/LoadingSkeleton";

/** Route-level loading boundary for CRM (V1-HARDEN-1, mission §12) — `/crm` itself is a KPI
 * dashboard (Pipeline Workspace), so this defaults to the dashboard shape; nested list/detail
 * routes (leads, opportunities) still inherit it unless they gain a more specific one. */
export default function CrmLoading() {
  return <PageSkeleton variant="dashboard" />;
}
