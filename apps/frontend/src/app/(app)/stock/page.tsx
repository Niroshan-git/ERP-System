import { Breadcrumb } from "@/components/Breadcrumb";

/**
 * Stock module home page — placeholder only, same precedent as buying/page.tsx.
 *
 * This route exists so the module switcher (Sidebar.tsx) and the "/" module picker have a
 * real destination that doesn't 404. No manufacturing/warehouse master data exists on the
 * live ERPNext instance yet (see PROGRESS.md), so a real KPI/overview workspace has nothing
 * to report on yet — that lands once real data exists.
 */
export default function StockHomePage() {
  return (
    <div>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Inventory" }]} />

      <div className="rounded-xl border border-border bg-surface p-6">
        <h1 className="mb-2 text-base font-semibold text-graphite-900">Inventory module</h1>
        <p className="text-sm text-graphite-500">
          Stock Entries (Material Issue / Material Receipt / Material Transfer), Stock Balance,
          Warehouses, Batches, and Serial Nos. This page will become the Inventory workspace
          home once real warehouse/stock master data exists to report on.
        </p>
      </div>
    </div>
  );
}
