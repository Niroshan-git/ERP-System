"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

/**
 * Renders a Ceylon Stack correlation ID (`CS-YYMMDD-XXXXXX`) prominently but cleanly —
 * monospace so it's visually distinct from surrounding prose without looking like random
 * clutter (mission §10). Always offers Copy. "Open Trace" is only a real link once
 * `openHref` is supplied by a caller that has a real Trace Detail route to send it to —
 * Trace Detail doesn't exist yet in this package (O-6 is Overview-only), so every current
 * call site renders the disabled/"coming soon" state rather than a dead link, per this
 * mission's §16 ("do not create fake successful behavior").
 */
export function TraceIdBadge({
  correlationId,
  openHref,
  size = "sm",
}: {
  correlationId: string;
  openHref?: string;
  size?: "sm" | "md";
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(correlationId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — silently no-op rather than
      // surfacing an error for a convenience action.
    }
  }

  const textSize = size === "md" ? "text-sm" : "text-xs";

  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-canvas px-2 py-1">
      <span className={`font-mono ${textSize} text-graphite-900`}>{correlationId}</span>
      <button
        type="button"
        onClick={copy}
        title="Copy trace ID"
        aria-label="Copy trace ID"
        className="rounded p-0.5 text-graphite-500 hover:bg-graphite-500/10 hover:text-graphite-900"
      >
        {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
      </button>
      {openHref ? (
        <a
          href={openHref}
          title="Open trace"
          aria-label="Open trace"
          className="rounded p-0.5 text-graphite-500 hover:bg-graphite-500/10 hover:text-signal"
        >
          <ExternalLink size={13} />
        </a>
      ) : (
        <span
          title="Trace Detail opens here once Error Explorer ships"
          aria-label="Open trace — coming in a future package"
          className="cursor-not-allowed rounded p-0.5 text-graphite-500/30"
        >
          <ExternalLink size={13} />
        </span>
      )}
    </span>
  );
}
