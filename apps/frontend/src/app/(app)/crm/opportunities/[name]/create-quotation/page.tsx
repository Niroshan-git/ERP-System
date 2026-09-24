import { notFound, redirect } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ConvertButtonClient } from "@/components/ConvertButtonClient";
import { formatAmount } from "@/lib/format";
import { ErpNextError, getDoc } from "@/lib/erpnext";
import { createQuotationFromOpportunityAction } from "@/lib/actions/opportunityQuotation";

type OpportunityForQuotation = {
  name: string;
  title?: string;
  status: string;
  opportunity_from: string;
  party_name: string;
  customer_name?: string;
  currency: string;
  items: { item_code: string; item_name: string; qty: number; uom: string; rate: number; amount: number }[];
};

/**
 * Confirmation step in front of `createQuotationFromOpportunityAction` — same
 * dedicated-page (not modal) shape `set-as-lost/page.tsx` already established. Gated the
 * same way the Opportunity detail page's own "Create Quotation" button is hidden
 * (Customer-partied, not resolved) — this page independently re-checks rather than trusting
 * the caller only hid the button, same defense-in-depth pattern `set-as-lost` uses.
 */
export default async function CreateQuotationFromOpportunityPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const opportunityName = decodeURIComponent(name);

  let doc: OpportunityForQuotation;
  try {
    doc = await getDoc<OpportunityForQuotation>("Opportunity", opportunityName);
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  const isResolved = doc.status === "Lost" || doc.status === "Converted" || doc.status === "Closed";
  if (isResolved || doc.opportunity_from !== "Customer") {
    redirect(`/crm/opportunities/${encodeURIComponent(opportunityName)}`);
  }

  const hasItems = doc.items.length > 0;

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "CRM", href: "/crm" },
          { label: "Opportunities", href: "/crm/opportunities" },
          { label: opportunityName, href: `/crm/opportunities/${encodeURIComponent(opportunityName)}` },
          { label: "Create Quotation" },
        ]}
      />
      <h1 className="mb-1 text-2xl font-medium text-graphite-900">Create Quotation</h1>
      <p className="mb-4 text-sm text-graphite-500">
        From Opportunity <span className="font-mono">{opportunityName}</span> for{" "}
        {doc.customer_name || doc.party_name}. This creates a real, canonical Sales Quotation carrying every line
        below, and marks this Opportunity&apos;s status as &quot;Quotation&quot;.
      </p>

      {hasItems ? (
        <div className="mb-4 overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-canvas text-xs uppercase tracking-wide text-graphite-500">
              <tr>
                <th className="px-3 py-2 text-left">Item</th>
                <th className="px-3 py-2 text-right">Qty</th>
                <th className="px-3 py-2 text-left">UOM</th>
                <th className="px-3 py-2 text-right">Rate</th>
                <th className="px-3 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {doc.items.map((item, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-3 py-2 text-graphite-900">{item.item_name || item.item_code}</td>
                  <td className="px-3 py-2 text-right">{item.qty}</td>
                  <td className="px-3 py-2">{item.uom}</td>
                  <td className="px-3 py-2 text-right">{formatAmount(item.rate)}</td>
                  <td className="px-3 py-2 text-right text-graphite-900">{formatAmount(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mb-4 text-sm text-alert">
          This Opportunity has no items yet. Add at least one item on its Overview tab before creating a Quotation.
        </p>
      )}

      {hasItems && (
        <ConvertButtonClient
          action={createQuotationFromOpportunityAction.bind(null, doc.name)}
          label="Create Quotation"
        />
      )}
    </div>
  );
}
