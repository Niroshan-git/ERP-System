import { Breadcrumb } from "@/components/Breadcrumb";

/**
 * Manufacturing module home page — placeholder, same precedent as buying/page.tsx and
 * stock/page.tsx before their own core flows shipped. Unlocked 2026-09-17 per the Current
 * Mission priority lock in the root CLAUDE.md (Sales -> Inventory MVP -> Buying ->
 * Manufacturing) now that Sales, Inventory, and Buying are accepted. Only the Work Orders
 * list page has shipped so far (see /manufacturing/work-orders) — Job Cards, BOM,
 * Workstations, and actions all remain out of scope until their own packages.
 */
export default function ManufacturingHomePage() {
  return (
    <div>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Manufacturing" }]} />

      <div className="rounded-xl border border-border bg-surface p-6">
        <h1 className="mb-2 text-base font-semibold text-graphite-900">Manufacturing module</h1>
        <p className="text-sm text-graphite-500">
          Work Orders are live (see the Work Orders list under this module). Job Cards, BOM,
          Workstations, and live status/OEE come next as their own packages. This page will
          become the Manufacturing workspace home once more of that data exists to report on.
        </p>
      </div>
    </div>
  );
}
