import { notFound, redirect } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { SetOpportunityLostForm } from "@/components/SetOpportunityLostForm";
import { ErpNextError, getDoc } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { markOpportunityLostAction } from "../../actions";

type OpportunityForLost = { status: string; party_name: string; customer_name?: string };

/**
 * "Mark Lost" step, linked from the Opportunity detail page. Gated the same shape
 * `set-as-lost/page.tsx` already established for Quotation — a resolved Opportunity
 * (Lost/Converted/Closed) can't be marked Lost again. ERPNext's own server-side check
 * (`has_active_quotation()`, source-verified) still applies underneath this and is
 * surfaced via `markOpportunityLostAction`'s normal error path if a Quotation already
 * exists against this Opportunity.
 */
export default async function MarkOpportunityLostPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const opportunityName = decodeURIComponent(name);

  let doc: OpportunityForLost;
  try {
    doc = await getDoc<OpportunityForLost>("Opportunity", opportunityName);
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  if (doc.status === "Lost" || doc.status === "Converted" || doc.status === "Closed") {
    redirect(`/crm/opportunities/${encodeURIComponent(opportunityName)}`);
  }

  const lostReasons = await fetchLinkOptions("Opportunity Lost Reason");

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "CRM", href: "/crm" },
          { label: "Opportunities", href: "/crm/opportunities" },
          { label: opportunityName, href: `/crm/opportunities/${encodeURIComponent(opportunityName)}` },
          { label: "Mark Lost" },
        ]}
      />
      <h1 className="mb-1 text-2xl font-medium text-graphite-900">Mark Lost</h1>
      <p className="mb-4 text-sm text-graphite-500">
        Opportunity <span className="font-mono">{opportunityName}</span> for {doc.customer_name || doc.party_name}.
        This calls ERPNext&apos;s own <code className="font-mono">declare_enquiry_lost</code> — a Lost Opportunity
        remains in your history, it is not deleted.
      </p>
      <SetOpportunityLostForm action={markOpportunityLostAction.bind(null, opportunityName)} lostReasons={lostReasons} />
    </div>
  );
}
