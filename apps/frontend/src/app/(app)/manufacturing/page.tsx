import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { DocTabs } from "@/components/DocTabs";
import { ManufacturingFlowMap } from "@/components/ManufacturingFlowMap";

/**
 * Manufacturing module home page — same precedent as buying/page.tsx and stock/page.tsx
 * before their own core flows shipped. Unlocked 2026-09-17 per the Current Mission priority
 * lock in the root CLAUDE.md (Sales -> Inventory MVP -> Buying -> Manufacturing) now that
 * Sales, Inventory, and Buying are accepted.
 *
 * Copy corrected 2026-09-19: BOM was previously listed here as a future Manufacturing
 * package, but the Manufacturing Masters (BOM) package moved it to Master Data as a
 * canonical entity (/master-data/boms) — Manufacturing links out to it rather than owning
 * it. Copy updated again same day (PP-1): Production Plans now has its own read-only
 * foundation (/manufacturing/production-plans) — see
 * docs/backend/05-manufacturing/production-plan.md's "Frontend footprint" section.
 *
 * Manufacturing Flow tab added 2026-09-21, mirroring `sales/page.tsx`'s "Sales Flow" tab.
 * `ManufacturingFlowMap`/`SalesFlowMap` are thin "use client" wrappers around the shared,
 * generic `FlowMap`/`FlowNodeDialog` components (`lib/flowMap.ts`'s doc comment) — NOT a fork
 * of the rendering logic, which stays fully shared. The wrapper exists only because a Server
 * Component page cannot pass `MFG_FLOW_RECORDS`/`FLOW_RECORDS` as props to a Client Component:
 * those records embed `LucideIcon` component references, which aren't plain serializable data
 * and crash React Server Components ("Only plain objects can be passed to Client Components
 * from Server Components...") if passed as a prop across that boundary — a real runtime error
 * hit and fixed same day, not a hypothetical. Importing the data inside each wrapper's own
 * "use client" module avoids crossing that boundary. Work Order Submit (`MFG-WF-004`) shipped
 * the same day, so this copy no longer says Work Order create-only. Copy corrected again
 * 2026-09-23: Job Cards now have a read-only list/detail + Cancel frontend (`MFG-JOBCARD-1`/
 * `MFG-JOBCARD-LC-1`) — no longer accurate to call them a future package. Workstations and OEE
 * remain their own future scoped packages.
 */
export default function ManufacturingHomePage() {
  const overviewTab = (
    <div className="rounded-xl border border-border bg-surface p-6">
      <h1 className="mb-2 text-base font-semibold text-graphite-900">Manufacturing module</h1>
      <p className="text-sm text-graphite-500">
        Work Orders are live (see the Work Orders list under this module), including create,
        submit, and material transfer for manufacture from a Work Order&apos;s own detail page.
        Bills of Materials are a canonical{" "}
        <Link href="/master-data/boms" className="text-signal hover:underline">
          Master Data
        </Link>{" "}
        entity, not a Manufacturing-owned page.{" "}
        <Link href="/manufacturing/production-plans" className="text-signal hover:underline">
          Production Plans
        </Link>{" "}
        cover the full lifecycle (create, submit, Make Work Order, Make Material Request,
        cancel). See the Manufacturing Flow tab for how these stages fit together end to end.{" "}
        <Link href="/manufacturing/job-cards" className="text-signal hover:underline">
          Job Cards
        </Link>{" "}
        have a read-only list/detail view plus Cancel. Workstations, execution/time-log actions,
        and live status/OEE remain future packages.
      </p>
    </div>
  );

  return (
    <div>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Manufacturing" }]} />

      <DocTabs
        tabs={[
          { id: "overview", label: "Overview", content: overviewTab },
          { id: "manufacturing-flow", label: "Manufacturing Flow", content: <ManufacturingFlowMap /> },
        ]}
      />
    </div>
  );
}
