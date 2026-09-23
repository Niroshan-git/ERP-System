"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Generic labeled copy-to-clipboard button — sibling to `TraceIdBadge`'s inline copy
 * icon, but for a full text block (the support summary) rather than a short ID. */
export function CopyTextButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable — no-op rather than surfacing an error for a
      // convenience action.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm font-medium text-graphite-900 hover:bg-canvas"
    >
      {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
      {copied ? "Copied" : label}
    </button>
  );
}
