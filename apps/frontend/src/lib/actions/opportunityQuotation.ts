"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createDoc, getDoc, updateDoc } from "@/lib/erpnext";
import { humanizeError } from "@/lib/masterActions";
import { getSellingDefaults } from "@/lib/salesDefaults";

export type QuotationHandoffState = { error?: string } | undefined;

type OpportunityItemForQuotation = { item_code: string; item_name: string; qty: number; uom: string; rate: number };
type OpportunityForQuotation = {
  name: string;
  opportunity_from: string;
  party_name: string;
  territory?: string;
  customer_group?: string;
  company: string;
  items: OpportunityItemForQuotation[];
};

/**
 * Opportunity → Quotation handoff (`CRM-2`, mission §14/§9.2). Deliberately reuses the
 * canonical, existing Sales Quotation capability — this is not a second Quotation
 * implementation, just a pre-filled `createDoc("Quotation", ...)` call, the same primitive
 * `sales/quotations/actions.ts`'s own `createQuotationAction` uses.
 *
 * `docs/backend/16-crm/crm-architecture.md` §9.2's live-verified finding: the existing
 * Sales Quotation frontend hardcodes `quotation_to: "Customer"` throughout (create form,
 * amend, line-selection flows) — it has never been built to accept `quotation_to: "Lead"`,
 * even though that's a real native ERPNext capability (`Lead → Quotation` direct
 * conversion, bypassing Opportunity/Customer entirely). Extending Sales' own create flow to
 * handle a second `quotation_to` value would touch an already-hardened, frozen-per-
 * Current-Mission Sales core module — explicitly `POST-V1` per that section's
 * recommendation. This action therefore only supports a Customer-partied Opportunity
 * (`opportunity_from === "Customer"`); a Lead-partied Opportunity's own detail page hides
 * this action and shows a message pointing at Lead→Customer conversion instead (see
 * `crm/opportunities/[name]/create-quotation/page.tsx`).
 */
export async function createQuotationFromOpportunityAction(opportunityName: string): Promise<QuotationHandoffState> {
  let opportunity: OpportunityForQuotation;
  try {
    opportunity = await getDoc<OpportunityForQuotation>("Opportunity", opportunityName);
  } catch (e) {
    return { error: humanizeError(e, "opportunity") };
  }

  if (opportunity.opportunity_from !== "Customer") {
    return {
      error:
        "Quotation can only be created for a Customer-linked Opportunity. Convert the originating Lead to a Customer first.",
    };
  }
  if (!opportunity.items || opportunity.items.length === 0) {
    return { error: "Add at least one item to this Opportunity before creating a Quotation." };
  }

  let defaults;
  try {
    defaults = await getSellingDefaults(opportunity.company);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not resolve company defaults." };
  }

  let quotationName: string;
  try {
    const quotation = await createDoc<{ name: string }>("Quotation", {
      naming_series: "SAL-QTN-.YYYY.-",
      quotation_to: "Customer",
      party_name: opportunity.party_name,
      opportunity: opportunity.name,
      transaction_date: new Date().toISOString().slice(0, 10),
      order_type: "Sales",
      company: defaults.company,
      currency: defaults.currency,
      conversion_rate: 1,
      selling_price_list: defaults.sellingPriceList,
      price_list_currency: defaults.priceListCurrency,
      plc_conversion_rate: 1,
      territory: opportunity.territory,
      customer_group: opportunity.customer_group,
      items: opportunity.items.map((i) => ({
        item_code: i.item_code,
        item_name: i.item_name,
        qty: i.qty,
        uom: i.uom,
        rate: i.rate,
      })),
    });
    quotationName = quotation.name;
  } catch (e) {
    return { error: humanizeError(e, "quotation") };
  }

  // Ceylon Stack's own explicit status write, same precedent
  // `convertLeadToOpportunityAction`/`convertLeadToCustomerAction` already established for
  // Lead: neither `CRM-UNV-005` (Opportunity's own outbound mapper field mapping) nor
  // `CRM-UNV-007` (what actually triggers `status: "Converted"`) confirm ERPNext sets this
  // automatically, so this app sets the one status transition its own action can vouch for
  // — "Quotation" — explicitly, rather than leaving the Opportunity silently stuck on
  // "Open" after a Quotation genuinely exists against it. A failure here still leaves a
  // real Quotation behind, surfaced plainly rather than as a generic failure.
  try {
    await updateDoc("Opportunity", opportunityName, { status: "Quotation" }, "create Quotation from Opportunity");
  } catch (e) {
    return {
      error: `Quotation ${quotationName} was created, but updating the Opportunity's status failed: ${humanizeError(e, "opportunity")}`,
    };
  }

  revalidatePath("/crm/opportunities");
  revalidatePath(`/crm/opportunities/${encodeURIComponent(opportunityName)}`);
  redirect(`/sales/quotations/${encodeURIComponent(quotationName)}`);
}
