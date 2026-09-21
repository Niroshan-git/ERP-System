import { Breadcrumb } from "@/components/Breadcrumb";
import { DocTabs } from "@/components/DocTabs";
import { StockFlowMap } from "@/components/StockFlowMap";

/**
 * Stock module home page — was a placeholder ("no warehouse/stock master data exists yet")
 * since before the Inventory MVP shipped. That copy went stale the moment the Inventory
 * (Stock) module was built and the 2026-09-16 live E2E QA pass accepted it (see
 * PROGRESS.md's "apps/frontend build: Inventory (Stock) module" entry) — this package
 * (2026-09-22) replaces it with a real workspace home, same precedent as
 * manufacturing/page.tsx and buying/page.tsx: a static Overview tab (no live KPI cards yet
 * — that richer workspace is a separate future package) plus an "Inventory Flow" tab.
 *
 * `StockFlowMap` is a thin "use client" wrapper around the shared, generic `FlowMap`/
 * `FlowNodeDialog` components (`lib/flowMap.ts`'s doc comment) — NOT a fork of the rendering
 * logic, which stays fully shared with Sales/Manufacturing/Buying's own flow maps.
 */
export default function StockHomePage() {
  const overviewTab = (
    <div className="rounded-xl border border-border bg-surface p-6">
      <h1 className="mb-2 text-base font-semibold text-graphite-900">Inventory module</h1>
      <p className="text-sm text-graphite-500">
        Stock Entries (Material Issue / Material Receipt / Material Transfer), Stock Balance,
        Warehouses, Batches, and Serial Nos are all live. Warehouses are a canonical Master
        Data entity shared with Buying, Sales, and Manufacturing. See the Inventory Flow tab
        for how the three Stock Entry purposes and stock tracking fit together.
      </p>
    </div>
  );

  return (
    <div>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Inventory" }]} />

      <DocTabs
        tabs={[
          { id: "overview", label: "Overview", content: overviewTab },
          { id: "inventory-flow", label: "Inventory Flow", content: <StockFlowMap /> },
        ]}
      />
    </div>
  );
}
