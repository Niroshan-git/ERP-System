import { Breadcrumb } from "@/components/Breadcrumb";
import { DocTabs } from "@/components/DocTabs";
import { BuyingFlowMap } from "@/components/BuyingFlowMap";

/**
 * Buying module home page — was a placeholder ("coming soon") since Phase 3 of the Buying +
 * multi-module nav plan, before any of the six Buying-cycle doctypes existed. That copy went
 * stale the moment Phase 4 shipped them and the 2026-09-16 live E2E QA pass accepted the core
 * cycle (see PROGRESS.md's "Buying core cycle" entry) — this package (2026-09-22) replaces it
 * with a real workspace home, same precedent as manufacturing/page.tsx: a static Overview tab
 * (no live KPI cards yet — that richer workspace, matching sales/page.tsx's number
 * cards/chart, is a separate future package) plus a "Buying Flow" tab.
 *
 * `BuyingFlowMap` is a thin "use client" wrapper around the shared, generic `FlowMap`/
 * `FlowNodeDialog` components (`lib/flowMap.ts`'s doc comment) — NOT a fork of the rendering
 * logic, which stays fully shared with Sales/Manufacturing's own flow maps.
 */
export default function BuyingHomePage() {
  const overviewTab = (
    <div className="rounded-xl border border-border bg-surface p-6">
      <h1 className="mb-2 text-base font-semibold text-graphite-900">Buying module</h1>
      <p className="text-sm text-graphite-500">
        The core purchasing cycle is live: Material Requests, RFQs, Supplier Quotations,
        Purchase Orders, Purchase Receipts, and Purchase Invoices, plus Suppliers as a
        canonical Master Data entity. Partial receiving and partial billing are tracked per
        Purchase Order. See the Buying Flow tab for how these stages fit together end to end.
      </p>
    </div>
  );

  return (
    <div>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Buying" }]} />

      <DocTabs
        tabs={[
          { id: "overview", label: "Overview", content: overviewTab },
          { id: "buying-flow", label: "Buying Flow", content: <BuyingFlowMap /> },
        ]}
      />
    </div>
  );
}
