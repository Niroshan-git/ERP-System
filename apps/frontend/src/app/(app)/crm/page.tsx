import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";

/**
 * CRM module home page — `CRM-1` (Leads, 2026-09-24) and `CRM-2` (Opportunities,
 * 2026-09-24), same minimal-home-page precedent `manufacturing/page.tsx` set before its own
 * core flow shipped. Both explicitly authorized ahead of full Finance V1 completion (see
 * `CLAUDE.md`'s mission-lock updates). Pipeline (Kanban)/CRM-specific activity tracking are
 * `CRM-3`/`CRM-4` — future, separately authorized packages, per
 * `docs/backend/16-crm/crm-architecture.md`'s roadmap.
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
          and{" "}
          <Link href="/crm/opportunities" className="text-signal hover:underline">
            Opportunities
          </Link>{" "}
          are live — list, detail, create, edit, Lead→Opportunity/Lead→Customer conversion,
          stage/probability/expected-value tracking, Mark Lost, and Opportunity→Quotation
          handoff into the existing canonical Sales Quotation flow. The Kanban pipeline
          workspace and CRM-specific activity/follow-up tracking remain future, separately
          scoped packages.
        </p>
      </div>
    </div>
  );
}
