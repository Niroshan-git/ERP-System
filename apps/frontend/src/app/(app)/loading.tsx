import { PageSkeleton } from "@/components/LoadingSkeleton";

/**
 * Fallback loading boundary for the app shell (V1-HARDEN-1, mission §12) — covers the
 * dashboard home page and any route directly under `(app)` without a more specific
 * module-level `loading.tsx` of its own (a closer `loading.tsx` always takes precedence for
 * its own subtree, per Next's nested-Suspense behavior).
 */
export default function AppShellLoading() {
  return <PageSkeleton variant="dashboard" />;
}
