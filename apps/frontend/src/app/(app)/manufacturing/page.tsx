import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";

/**
 * Manufacturing module home page — placeholder, same precedent as buying/page.tsx and
 * stock/page.tsx before their own core flows shipped. Unlocked 2026-09-17 per the Current
 * Mission priority lock in the root CLAUDE.md (Sales -> Inventory MVP -> Buying ->
 * Manufacturing) now that Sales, Inventory, and Buying are accepted.
 *
 * Copy corrected 2026-09-19: BOM was previously listed here as a future Manufacturing
 * package, but the Manufacturing Masters (BOM) package moved it to Master Data as a
 * canonical entity (/master-data/boms) — Manufacturing links out to it rather than owning
 * it. Copy updated again same day (PP-1): Production Plans now has its own read-only
 * foundation (/manufacturing/production-plans) — see
 * docs/backend/05-manufacturing/production-plan.md's "Frontend footprint" section. Job
 * Cards, Workstations, and OEE remain their own future scoped packages.
 */
export default function ManufacturingHomePage() {
  return (
    <div>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Manufacturing" }]} />

      <div className="rounded-xl border border-border bg-surface p-6">
        <h1 className="mb-2 text-base font-semibold text-graphite-900">Manufacturing module</h1>
        <p className="text-sm text-graphite-500">
          Work Orders are live (see the Work Orders list under this module), including material
          transfer for manufacture from a Work Order&apos;s own detail page. Bills of Materials
          are a canonical{" "}
          <Link href="/master-data/boms" className="text-signal hover:underline">
            Master Data
          </Link>{" "}
          entity, not a Manufacturing-owned page.{" "}
          <Link href="/manufacturing/production-plans" className="text-signal hover:underline">
            Production Plans
          </Link>{" "}
          are now live as a read-only foundation (no create/edit/submit yet). Job Cards,
          Workstations, and live status/OEE remain future packages.
        </p>
      </div>
    </div>
  );
}
