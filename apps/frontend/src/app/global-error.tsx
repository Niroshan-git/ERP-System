"use client";

/**
 * Root catastrophic-failure boundary (V1-HARDEN-1, mission §8 "Root/global"). Only activates
 * when something fails badly enough to take down the root layout itself (e.g. a bug in
 * `app/layout.tsx`) — every other failure in this app is caught closer to its source by
 * `(app)/error.tsx` or a module-level `error.tsx` first, per Next's nested error-boundary
 * bubbling (a child boundary swallows the error before it ever reaches this one).
 *
 * Must define its own `<html>`/`<body>` and its own styles — it replaces the root layout, so
 * none of `app/layout.tsx`'s fonts/theme-init script/global styles are available "for free"
 * (see node_modules/next/dist/docs/.../error.md's "Good to know"). Imports `globals.css`
 * directly (Next explicitly allows/expects this for `global-error.tsx`) so the same design
 * tokens (--signal/--alert/--graphite-900/--canvas/--border) render correctly, but skips the
 * Google Fonts + dark-mode-init script to keep this boundary as dependency-free as possible —
 * appropriate for a screen whose whole job is to still render when something else broke.
 */
import Link from "next/link";
import "./globals.css";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const correlationId = typeof error.digest === "string" && error.digest.length > 0 ? error.digest : undefined;

  return (
    <html lang="en">
      <body className="min-h-screen bg-canvas text-graphite-900">
        <div className="flex min-h-screen items-center justify-center px-6 py-12">
          <div role="alert" aria-live="assertive" className="w-full max-w-md text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-alert/10">
              <span className="text-2xl" aria-hidden="true">
                !
              </span>
            </div>
            <h1 className="text-base font-semibold">Ceylon Stack couldn&apos;t load</h1>
            <p className="mt-1 text-sm text-graphite-500">
              Something went wrong loading the application shell. This is usually temporary — try again, or
              contact your administrator if it continues.
            </p>
            {correlationId && (
              <p className="mt-4 font-mono text-xs text-graphite-500">
                Reference: <span className="text-graphite-900">{correlationId}</span>
              </p>
            )}
            <div className="mt-5 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => retry()}
                className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90"
              >
                Try again
              </button>
              <Link href="/" className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-graphite-500/10">
                Reload dashboard
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
