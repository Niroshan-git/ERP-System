"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createDoc, getDoc, updateDoc } from "@/lib/erpnext";
import { humanizeError } from "@/lib/masterActions";

export type ConversionState = { error?: string } | undefined;

type LeadForConversion = {
  name: string;
  lead_name: string;
  company_name?: string;
  email_id?: string;
  mobile_no?: string;
  lead_owner?: string;
};

/**
 * Lead → Opportunity conversion, field mapping source-verified against ERPNext's own
 * `erpnext.crm.doctype.lead.mapper.make_opportunity` (`docs/backend/16-crm/
 * crm-architecture.md` §6) and reimplemented here rather than called directly — matching
 * this app's existing convention of building its own create payloads for every other
 * conversion in this codebase (Quotation → Sales Order, etc.) instead of depending on
 * Desk-specific whitelisted RPCs.
 *
 * `opportunity_from` is hardcoded to the literal `"Lead"` — never accepts caller input —
 * which is itself the server-side allowlist `docs/backend/16-crm/crm-architecture.md` §9.3
 * calls for (this app never writes any other `opportunity_from` value anywhere).
 *
 * ERPNext's mapper never sets `Lead.status` on conversion (§6, source-verified) — this
 * action explicitly does, immediately after the Opportunity is created, exactly as that
 * section instructs.
 *
 * No `/crm/opportunities/[name]` detail route exists (out of `CRM-1`'s scope, `CRM-2`
 * territory) — on success this redirects back to the Lead's own detail page with the new
 * Opportunity's ID as a query param, rendered as plain text there (see
 * `crm/leads/[name]/page.tsx`'s inline success banner), not a link to a page that doesn't
 * exist.
 *
 * Takes only `leadName`, not `ConvertButtonClient`'s full `(state, formData)` shape — same
 * precedent `accounting/bank-accounts/actions.ts`'s `deleteBankAccountAction` doc comment
 * sets for a no-input action: `.bind(null, doc.name)` on a single-argument function is still
 * assignable to a two-argument `action` prop, so no unused `_prevState`/`_formData`
 * parameters are needed here.
 */
export async function convertLeadToOpportunityAction(leadName: string): Promise<ConversionState> {
  let lead: LeadForConversion;
  try {
    lead = await getDoc<LeadForConversion>("Lead", leadName);
  } catch (e) {
    return { error: humanizeError(e, "lead") };
  }

  let opportunityName: string;
  try {
    const opp = await createDoc<{ name: string }>("Opportunity", {
      opportunity_from: "Lead",
      party_name: lead.name,
      contact_display: lead.lead_name,
      customer_name: lead.company_name,
      contact_email: lead.email_id,
      contact_mobile: lead.mobile_no,
      opportunity_owner: lead.lead_owner,
    });
    opportunityName = opp.name;
  } catch (e) {
    return { error: humanizeError(e, "opportunity") };
  }

  try {
    await updateDoc("Lead", leadName, { status: "Opportunity" }, "convert Lead to Opportunity");
  } catch (e) {
    // The Opportunity now genuinely exists even though this status write failed — surface
    // that plainly rather than a generic "conversion failed" message that would suggest
    // nothing happened.
    return { error: `Opportunity ${opportunityName} was created, but updating the Lead's status failed: ${humanizeError(e, "lead")}` };
  }

  revalidatePath("/crm/leads");
  revalidatePath(`/crm/leads/${encodeURIComponent(leadName)}`);
  redirect(`/crm/leads/${encodeURIComponent(leadName)}?converted_opportunity=${encodeURIComponent(opportunityName)}`);
}

/**
 * Lead → Customer conversion, field mapping source-verified against ERPNext's own
 * `erpnext.crm.doctype.lead.mapper.make_customer` (`docs/backend/16-crm/
 * crm-architecture.md` §6), same reimplemented-payload convention as the Opportunity
 * conversion above. Writes `Customer.lead_name` — the conversion-provenance pointer field
 * `docs/backend/16-crm/crm-architecture.md` §10 identifies as already present on the live
 * Customer schema but previously never populated by this frontend.
 *
 * Deliberately does **not** call `master-data/customers/actions.ts`'s
 * `createCustomerAction` — that action's `fieldsFromForm()` doesn't accept `lead_name` and
 * is bound to `useActionState`'s browser-form flow (`FormData` in, redirect to
 * `/master-data/customers/new`'s own success path); extending it to also handle this very
 * different call shape would risk affecting the normal Customer-create UI. This is the
 * small, additive, separate action the brief calls for instead — same `createDoc("Customer",
 * ...)` primitive, no changes to the existing Customer create flow.
 *
 * `Customer` already has a real detail route (`/master-data/customers/[name]`, unlike
 * Opportunity), so a successful conversion redirects straight there. Same no-unused-params
 * shape as `convertLeadToOpportunityAction` above — see its doc comment.
 */
export async function convertLeadToCustomerAction(leadName: string): Promise<ConversionState> {
  let lead: LeadForConversion;
  try {
    lead = await getDoc<LeadForConversion>("Lead", leadName);
  } catch (e) {
    return { error: humanizeError(e, "lead") };
  }

  const customerName = lead.company_name || lead.lead_name;
  const customerType = lead.company_name ? "Company" : "Individual";

  let createdCustomerName: string;
  try {
    const customer = await createDoc<{ name: string }>("Customer", {
      customer_name: customerName,
      customer_type: customerType,
      lead_name: lead.name,
    });
    createdCustomerName = customer.name;
  } catch (e) {
    return { error: humanizeError(e, "customer") };
  }

  try {
    await updateDoc("Lead", leadName, { status: "Converted" }, "convert Lead to Customer");
  } catch (e) {
    return { error: `Customer ${createdCustomerName} was created, but updating the Lead's status failed: ${humanizeError(e, "lead")}` };
  }

  revalidatePath("/crm/leads");
  revalidatePath(`/crm/leads/${encodeURIComponent(leadName)}`);
  revalidatePath("/master-data/customers");
  redirect(`/master-data/customers/${encodeURIComponent(createdCustomerName)}`);
}
