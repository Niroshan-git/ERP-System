import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { DocTabs } from "@/components/DocTabs";
import { FlowMap } from "@/components/FlowMap";
import { MFG_FLOW_RECORDS, MFG_FLOW_SCENES, MFG_FLOW_SCENE_ORDER } from "@/lib/manufacturingFlowMap";

/** "Process notes & references" content for the Manufacturing Flow map. */
const MANUFACTURING_FLOW_NOTES = (
  <>
    <p>
      This is a Ceylon Stack workflow-navigation map of this app&apos;s own Manufacturing module, not a live
      ERPNext Desk screen. It shows two real, currently-supported routes — production driven by a Production
      Plan, and a Work Order created directly against a BOM. Job Card and the final Manufacture Stock Entry are
      shown for completeness even though this frontend doesn&apos;t yet expose dedicated pages for them.
    </p>
    <p>
      Field-level detail for every stage (required fields, submit-time validation, stock/accounting impact) is
      documented in <code>docs/backend/05-manufacturing/</code> — this map is a navigation aid, not a
      replacement for that canonical reference.
    </p>
  </>
);

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
 * Manufacturing Flow tab added 2026-09-21, mirroring `sales/page.tsx`'s "Sales Flow" tab —
 * rendered by the shared `FlowMap` component (`components/FlowMap.tsx`) against this module's
 * own data (`lib/manufacturingFlowMap.ts`), the same pattern `sales/page.tsx` uses. Originally
 * built as a forked `ManufacturingFlowMap`/`ManufacturingFlowNodeDialog` pair; generalized the
 * same day per `FRONTEND_GUIDE.md` §7's "keep extending, don't fork" rule (`SalesFlowMap`/
 * `SalesFlowNodeDialog` were explicitly listed there as reusable) — see `lib/flowMap.ts`'s doc
 * comment. Work Order Submit (`MFG-WF-004`) shipped the same day, so this copy no longer says
 * Work Order create-only. Job Cards, Workstations, and OEE remain their own future scoped
 * packages.
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
        cancel). See the Manufacturing Flow tab for how these stages fit together end to end.
        Job Cards, Workstations, and live status/OEE remain future packages.
      </p>
    </div>
  );

  return (
    <div>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Manufacturing" }]} />

      <DocTabs
        tabs={[
          { id: "overview", label: "Overview", content: overviewTab },
          {
            id: "manufacturing-flow",
            label: "Manufacturing Flow",
            content: (
              <FlowMap
                records={MFG_FLOW_RECORDS}
                scenes={MFG_FLOW_SCENES}
                sceneOrder={MFG_FLOW_SCENE_ORDER}
                defaultScene="planned"
                idPrefix="mfg-flow"
                downloadFilePrefix="ceylonstack-manufacturing-flow"
                tablistLabel="Manufacturing process variants"
                notes={MANUFACTURING_FLOW_NOTES}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
