import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";

/**
 * CRM module home page — first package (CRM-1, 2026-09-24), same minimal-home-page
 * precedent `manufacturing/page.tsx` set before its own core flow shipped. Explicitly
 * authorized ahead of full Finance V1 completion (see `CLAUDE.md`'s 2026-09-24 `CRM-1`
 * mission-lock update) — Leads (list/detail/create/edit/status/search/filter, Lead→
 * Opportunity and Lead→Customer conversion entry points) is the only screen this package
 * ships. Opportunities/Pipeline/Activities are `CRM-2`..`CRM-4` — future, separately
 * authorized packages, per `docs/backend/16-crm/crm-architecture.md`'s roadmap.
 */
export default function CrmHomePage() {
  return (
    <div>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "CRM" }]} />

      <div className="rounded-xl border border-border bg-surface p-6">
        <h1 className="mb-2 text-base font-semibold text-graphite-900">CRM module</h1>
        <p className="text-sm text-graphite-500">
          <Link href="/crm/leads" className="text-signal hover:underline">
            Leads
          </Link>{" "}
          are live — list, detail, create, edit, status changes, search/filter, and
          Convert to Opportunity / Convert to Customer entry points from a Lead&apos;s own
          detail page. Opportunities, the sales pipeline, and CRM-specific activity/follow-up
          tracking remain future, separately scoped packages.
        </p>
      </div>
    </div>
  );
}
