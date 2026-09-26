"use client";

import { ModuleErrorBoundary } from "@/components/ErrorState";

/**
 * Application-shell boundary (V1-HARDEN-1, mission §8 "Application shell"). Catches anything
 * inside the authenticated app that isn't already caught closer to its source by a
 * module-level `error.tsx` (e.g. the `(app)/page.tsx` dashboard itself, or any future route
 * added directly under a module without its own boundary yet). The Sidebar/Topbar chrome from
 * `(app)/layout.tsx` is NOT wrapped by this boundary (error.tsx never wraps its own segment's
 * layout — see loading.md's "Behavior" section) and keeps rendering/navigable even when this
 * fires, so a failure here doesn't strand the user outside the app shell entirely.
 */
export default function AppShellError({
  error,
  retry,
  reset,
}: {
  error: Error & { digest?: string };
  retry?: () => void;
  reset: () => void;
}) {
  return <ModuleErrorBoundary error={error} retry={retry} reset={reset} moduleLabel="Ceylon Stack" homeHref="/" />;
}
