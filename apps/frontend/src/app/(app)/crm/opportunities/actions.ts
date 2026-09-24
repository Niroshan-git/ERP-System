"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { callDocMethod, createDoc, getDoc, updateDoc } from "@/lib/erpnext";
import { humanizeError } from "@/lib/masterActions";
import { parseLineRows } from "@/lib/lineRows";
import { getSellingDefaults } from "@/lib/salesDefaults";

export type FormState = { error?: string } | undefined;

/**
 * `opportunity_from`'s underlying field type is an unrestricted `Link → DocType`
 * (`get_doctype_fields`, live-verified) — nothing in ERPNext's schema itself restricts the
 * value (`CRM-UNV-003`). Server-side allowlist per `docs/backend/16-crm/
 * crm-architecture.md` §9.3's rule, same class of guard `party-contact-address-
 * architecture.md` §2.5 already established for `link_doctype`. `Prospect` is a real,
 * schema-valid value too (§5.3) but deliberately not exposed by `OpportunityForm`'s party
 * picker — Prospect itself is `POST-V1` scope, not built by `CRM-2` — so this allowlist is
 * narrower than the full set the architecture doc names, matching what the UI actually
 * offers rather than what the schema alone would permit.
 */
const PARTY_TYPES = ["Lead", "Customer"] as const;
type PartyType = (typeof PARTY_TYPES)[number];

const NUMBER_KEYS = ["probability", "opportunity_amount", "annual_revenue"] as const;
const TEXT_KEYS = [
  "title",
  "opportunity_type",
  "sales_stage",
  "expected_closing",
  "territory",
  "industry",
  "market_segment",
  "customer_group",
  "no_of_employees",
  "website",
  "city",
  "state",
  "country",
  "contact_person",
  "contact_email",
  "contact_mobile",
  "whatsapp",
  "phone",
  "phone_ext",
  "customer_address",
  "transaction_date",
] as const;

function buildCommonFields(formData: FormData): Record<string, unknown> {
  const fields: Record<string, unknown> = {};

  for (const key of TEXT_KEYS) {
    const raw = String(formData.get(key) ?? "").trim();
    fields[key] = raw || undefined;
  }
  for (const key of NUMBER_KEYS) {
    const raw = String(formData.get(key) ?? "").trim();
    fields[key] = raw ? Number(raw) : undefined;
  }

  const items = parseLineRows(formData, "items").map((i) => ({
    item_code: i.item_code,
    item_name: i.item_name,
    qty: i.qty,
    uom: i.uom,
    rate: i.rate,
  }));
  fields.items = items;

  return fields;
}

type LeadForOpportunity = { name: string; lead_name: string; company_name?: string; email_id?: string; mobile_no?: string };
type CustomerForOpportunity = { name: string; customer_name: string };

export async function createOpportunityAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const opportunityFrom = String(formData.get("opportunity_from") ?? "") as PartyType;
  const partyName = String(formData.get("party_name") ?? "").trim();

  if (!PARTY_TYPES.includes(opportunityFrom)) {
    return { error: "Select a party type." };
  }
  if (!partyName) {
    return { error: `Select a ${opportunityFrom.toLowerCase()}.` };
  }

  const fields = buildCommonFields(formData);
  if (!fields.transaction_date) {
    return { error: "Opportunity date is required." };
  }

  // Same field-mapping convention `lib/actions/leadConversion.ts`'s
  // `convertLeadToOpportunityAction` established for Lead→Opportunity — reimplemented
  // client-side rather than depending on ERPNext's own `opportunity`/`lead` mapper RPCs,
  // matching this app's existing convention. Customer has no flat email/mobile fields of
  // its own (those live on Contact via Dynamic Link, `MD-UNV-003` — out of scope to wire up
  // here), so a Customer-partied Opportunity only derives `customer_name`.
  let derived: { customer_name?: string; contact_display?: string; contact_email?: string; contact_mobile?: string };
  try {
    if (opportunityFrom === "Lead") {
      const lead = await getDoc<LeadForOpportunity>("Lead", partyName);
      derived = {
        customer_name: lead.company_name,
        contact_display: lead.lead_name,
        contact_email: lead.email_id,
        contact_mobile: lead.mobile_no,
      };
    } else {
      const customer = await getDoc<CustomerForOpportunity>("Customer", partyName);
      derived = { customer_name: customer.customer_name };
    }
  } catch (e) {
    return { error: humanizeError(e, opportunityFrom.toLowerCase()) };
  }

  let defaults;
  try {
    defaults = await getSellingDefaults();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not resolve company defaults." };
  }

  let name: string;
  try {
    const doc = await createDoc<{ name: string }>("Opportunity", {
      ...fields,
      opportunity_from: opportunityFrom,
      party_name: partyName,
      customer_name: derived.customer_name,
      contact_display: derived.contact_display,
      // Spread first, then override — a blank form field must still fall back to the
      // party's own derived value, not silently clobber it (object-spread ordering bug
      // caught during CRM-2's own pre-review pass).
      contact_email: (fields.contact_email as string | undefined) ?? derived.contact_email,
      contact_mobile: (fields.contact_mobile as string | undefined) ?? derived.contact_mobile,
      company: defaults.company,
      currency: defaults.currency,
      conversion_rate: 1,
    });
    name = doc.name;
  } catch (e) {
    return { error: humanizeError(e, "opportunity") };
  }

  revalidatePath("/crm/opportunities");
  redirect(`/crm/opportunities/${encodeURIComponent(name)}`);
}

export async function updateOpportunityAction(
  name: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const fields = buildCommonFields(formData);
  if (!fields.transaction_date) {
    return { error: "Opportunity date is required." };
  }

  try {
    await updateDoc("Opportunity", name, fields);
  } catch (e) {
    return { error: humanizeError(e, "opportunity") };
  }

  revalidatePath("/crm/opportunities");
  revalidatePath(`/crm/opportunities/${encodeURIComponent(name)}`);
  redirect(`/crm/opportunities/${encodeURIComponent(name)}?saved=1`);
}

/**
 * "Mark Lost" — calls ERPNext's real `Opportunity.declare_enquiry_lost(lost_reasons_list,
 * competitors, detailed_reason)` (source-verified, `crm-architecture.md` §6 — the exact
 * same underlying mechanism `setQuotationAsLostAction` already calls for Quotation), not a
 * plain `updateDoc({status: "Lost"})` — `lost_reasons`/`competitors` only get populated
 * through this method, and ERPNext itself blocks the call server-side
 * (`has_active_quotation()`) when an active Quotation already exists against this
 * Opportunity, surfaced here via the normal `humanizeError` path, not pre-checked
 * client-side.
 */
export async function markOpportunityLostAction(
  name: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const lostReasons = formData
    .getAll("lost_reasons")
    .map((r) => String(r).trim())
    .filter(Boolean);
  if (lostReasons.length === 0) {
    return { error: "Select at least one lost reason." };
  }
  const detailed_reason = String(formData.get("detailed_reason") ?? "").trim() || undefined;

  try {
    await callDocMethod("Opportunity", name, "declare_enquiry_lost", {
      lost_reasons_list: lostReasons.map((r) => ({ lost_reason: r })),
      competitors: [],
      detailed_reason,
    });
  } catch (e) {
    return { error: humanizeError(e, "opportunity") };
  }

  revalidatePath("/crm/opportunities");
  revalidatePath(`/crm/opportunities/${encodeURIComponent(name)}`);
  redirect(`/crm/opportunities/${encodeURIComponent(name)}`);
}
