"use client";

import { useState } from "react";
import Link from "next/link";
import { formatAmount } from "@/lib/format";
import { BUCKET_DISPLAY } from "@/lib/followupBucket";
import type { PipelineRow } from "@/lib/crmPipeline";
import type { StageUpdateResult } from "@/app/(app)/crm/opportunities/actions";

/**
 * `CRM-4`'s pipeline board — grouped-by-`sales_stage` columns on desktop/tablet, the same
 * columns rendered as full-width stacked sections on narrow screens (a `flex-col`→`md:flex-row`
 * switch, not a second component/data path) rather than shrinking the desktop Kanban, per the
 * mission brief's explicit "do not force a tiny desktop Kanban onto the screen" instruction (§18).
 *
 * Stage movement is an explicit `<select>` per card, not drag-and-drop — see
 * `updateOpportunityStageAction`'s own doc comment for why. Optimistic: the card's column
 * membership updates immediately on change; a failed update reverts the card to its last known
 * stage and surfaces the server's error inline on that card, never silently.
 */
export function PipelineBoard({
  rows,
  stages,
  emptyLabel,
  onStageChange,
}: {
  rows: PipelineRow[];
  stages: string[];
  emptyLabel: string;
  onStageChange: (name: string, stage: string) => Promise<StageUpdateResult>;
}) {
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Per-row, not a single board-wide flag — a QA finding on this package's own first draft
  // caught that one shared `useTransition()` disabled every card's `<select>` while any one
  // card's stage change was in flight, which is a real usability rough edge on a board meant
  // to let someone move several deals in quick succession.
  const [pendingNames, setPendingNames] = useState<Record<string, boolean>>({});

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-graphite-500">
        {emptyLabel}
      </div>
    );
  }

  function effectiveStage(row: PipelineRow): string {
    return overrides[row.name] ?? row.sales_stage ?? "";
  }

  async function handleStageChange(row: PipelineRow, nextStage: string) {
    const previousStage = effectiveStage(row);
    setOverrides((prev) => ({ ...prev, [row.name]: nextStage }));
    setPendingNames((prev) => ({ ...prev, [row.name]: true }));
    setErrors((prev) => {
      if (!(row.name in prev)) return prev;
      const next = { ...prev };
      delete next[row.name];
      return next;
    });

    try {
      const result = await onStageChange(row.name, nextStage);
      if (result.error) {
        setOverrides((prev) => ({ ...prev, [row.name]: previousStage }));
        setErrors((prev) => ({ ...prev, [row.name]: result.error! }));
      }
    } finally {
      setPendingNames((prev) => {
        const next = { ...prev };
        delete next[row.name];
        return next;
      });
    }
  }

  const columns = [...stages, "No Stage"].map((stage) => ({
    stage,
    cards: rows.filter((r) => (effectiveStage(r) || "No Stage") === stage),
  }));

  return (
    <div className="flex flex-col gap-4 md:flex-row md:overflow-x-auto md:pb-2">
      {columns.map(({ stage, cards }) => (
        <div key={stage} className="w-full shrink-0 md:w-72">
          <div className="mb-2 flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-graphite-900">{stage}</h3>
            <span className="text-xs text-graphite-500">{cards.length}</span>
          </div>
          <div className="space-y-2 rounded-xl bg-canvas/50 p-2 md:min-h-24">
            {cards.length === 0 ? (
              <p className="px-2 py-3 text-center text-xs text-graphite-500">No opportunities</p>
            ) : (
              cards.map((row) => {
                const health = row.nextFollowup
                  ? BUCKET_DISPLAY[row.nextFollowup.bucket]
                  : { label: "No Next Action", tone: "neutral" as const };
                return (
                  <div key={row.name} className="rounded-lg border border-border bg-surface p-3 shadow-sm">
                    <Link
                      href={`/crm/opportunities/${encodeURIComponent(row.name)}`}
                      className="block truncate font-medium text-signal hover:underline"
                      title={row.title || row.name}
                    >
                      {row.title || row.name}
                    </Link>
                    <p className="truncate text-xs text-graphite-500">
                      {row.customer_name || row.party_name} ({row.opportunity_from})
                    </p>
                    <div className="mt-2 flex items-center justify-between text-xs text-graphite-900">
                      <span>
                        {formatAmount(row.opportunity_amount)} {row.currency}
                      </span>
                      <span className="text-graphite-500">{row.probability}%</span>
                    </div>
                    <p className="mt-1 text-xs text-graphite-500">
                      Close: {row.expected_closing || "—"}
                      {row.isPastExpectedClose && <span className="text-alert"> (past due)</span>}
                    </p>
                    {row.opportunity_owner && <p className="mt-1 truncate text-xs text-graphite-500">Owner: {row.opportunity_owner}</p>}
                    <div className="mt-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          health.tone === "alert"
                            ? "bg-alert/10 text-alert"
                            : health.tone === "signal"
                              ? "bg-signal/10 text-signal"
                              : health.tone === "success"
                                ? "bg-success/10 text-success"
                                : "bg-graphite-500/10 text-graphite-500"
                        }`}
                      >
                        {row.nextFollowup ? `${health.label}${row.nextFollowup.dueDate ? `: ${row.nextFollowup.dueDate}` : ""}` : health.label}
                      </span>
                    </div>
                    <label className="mt-2 block">
                      <span className="sr-only">Change stage</span>
                      <select
                        value={effectiveStage(row)}
                        disabled={Boolean(pendingNames[row.name])}
                        onChange={(e) => handleStageChange(row, e.target.value)}
                        className="w-full rounded-md border border-border bg-canvas px-2 py-1 text-xs text-graphite-900 focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
                      >
                        {!row.sales_stage && <option value="">No Stage</option>}
                        {stages.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </label>
                    {errors[row.name] && <p className="mt-1 text-xs text-alert">{errors[row.name]}</p>}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
