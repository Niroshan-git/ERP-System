"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SALES_FLOW_STAGES } from "@/lib/salesFlowContent";

/**
 * SAP B1-style process map for the Dashboard's "Sales Flow" tab — the same four stages
 * every detail page already links together via Connections/RelationshipMap, laid out
 * here as a static left-to-right flow instead of a specific document's real chain.
 * Selecting a stage updates the info panel below; it never navigates by itself — only
 * the "Open list ->" link inside the info panel does that.
 */
export function SalesFlowDiagram() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = SALES_FLOW_STAGES.find((s) => s.id === selectedId) ?? null;

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-border bg-surface p-6">
        <div className="grid min-w-[640px] grid-cols-[1fr_32px_1fr_32px_1fr_32px_1fr] items-center gap-y-3">
          {SALES_FLOW_STAGES.map((stage, i) => (
            <FlowStageCard
              key={stage.id}
              stage={stage}
              selected={stage.id === selectedId}
              onSelect={() => setSelectedId(stage.id)}
              arrowAfter={i < SALES_FLOW_STAGES.length - 1}
            />
          ))}

          {/* Bypass connector: Sales Order -> Sales Invoice, skipping Delivery Note.
              Shares the row's own column tracks (col-start-3 = Sales Order's column,
              col-end-8 = just past Sales Invoice's column) so it stays pixel-aligned
              with the cards above without any separate measurement. */}
          <div className="col-start-3 col-end-8 row-start-2 mt-2 flex items-center gap-1.5 border-t border-dashed border-graphite-500/40 pt-2 text-xs text-graphite-500">
            <ArrowRight size={12} />
            optional: invoice directly from the Sales Order — skips Delivery Note
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-surface p-4">
        {selected ? (
          <div>
            <div className="flex items-center gap-2">
              <selected.icon size={16} className="text-signal" />
              <h3 className="text-sm font-semibold text-graphite-900">{selected.label}</h3>
            </div>
            <p className="mt-2 text-sm text-graphite-500">{selected.blurb}</p>
            <Link href={selected.href} className="mt-3 inline-block text-sm font-medium text-signal hover:underline">
              Open {selected.label}s →
            </Link>
          </div>
        ) : (
          <p className="text-sm text-graphite-500">Select a stage above to see how it works.</p>
        )}
      </div>
    </div>
  );
}

function FlowStageCard({
  stage,
  selected,
  onSelect,
  arrowAfter,
}: {
  stage: (typeof SALES_FLOW_STAGES)[number];
  selected: boolean;
  onSelect: () => void;
  arrowAfter: boolean;
}) {
  const Icon = stage.icon;
  return (
    <>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={`row-start-1 flex flex-col items-center gap-2 rounded-lg border bg-canvas px-3 py-4 text-center shadow-sm transition hover:border-signal ${
          selected ? "border-signal ring-1 ring-signal" : "border-border"
        }`}
      >
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full ${
            selected ? "bg-signal text-white" : "bg-signal/10 text-signal"
          }`}
        >
          <Icon size={17} />
        </span>
        <span className="text-sm font-medium text-graphite-900">{stage.label}</span>
      </button>
      {arrowAfter && (
        <span className="row-start-1 flex justify-center text-graphite-500/60">
          <ArrowRight size={18} />
        </span>
      )}
    </>
  );
}
