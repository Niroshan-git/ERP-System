"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { looksLikeCorrelationId } from "@/lib/observabilityCenter/correlationIdFormat";

/**
 * Global trace search (mission §23) — "paste a trace ID, reach the trace" is the primary
 * support workflow. Scoped to exact trace-ID lookup only, per the brief's own instruction
 * ("design for exact trace lookup first... do not implement unsafe client-side scanning
 * over all logs") — broader search (document/user/operation text) is a later increment.
 *
 * A correctly-formatted ID navigates straight to Trace Detail (O-7) — that route owns the
 * honest not-found state itself (mission §24) when the trace doesn't exist, so this
 * component doesn't need to (and, without an API call, can't) pre-check existence. A
 * malformed ID never navigates — inline feedback only, never a guessed/fake destination.
 */
export function ObservabilityTraceSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setFeedback(null);
      return;
    }
    if (looksLikeCorrelationId(trimmed)) {
      router.push(`/admin/observability/traces/${encodeURIComponent(trimmed.toUpperCase())}`);
      return;
    }
    setFeedback("Enter an exact trace ID, e.g. CS-260923-F82A41 — broader search is a future increment.");
  }

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-graphite-500" />
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setFeedback(null);
            }}
            placeholder="Search trace ID, document, user..."
            className="w-full rounded-md border border-border bg-canvas py-1.5 pl-8 pr-2.5 text-sm text-graphite-900 focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
          />
        </div>
        <button
          type="submit"
          className="shrink-0 rounded-md bg-signal px-3 py-1.5 text-sm font-medium text-white hover:bg-signal/90"
        >
          Search
        </button>
      </form>
      {feedback && <p className="mt-1.5 text-xs text-graphite-500">{feedback}</p>}
    </div>
  );
}
