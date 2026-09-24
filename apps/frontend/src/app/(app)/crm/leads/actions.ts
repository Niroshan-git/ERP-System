"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createDoc, updateDoc } from "@/lib/erpnext";
import { fieldsFromFormData, humanizeError } from "@/lib/masterActions";
import { MANUAL_LEAD_STATUS_OPTIONS } from "@/lib/leadStatusOptions";

export type FormState = { error?: string } | undefined;

const TEXT_KEYS = [
  "salutation",
  "first_name",
  "middle_name",
  "last_name",
  "job_title",
  "gender",
  "type",
  "request_type",
  "email_id",
  "website",
  "mobile_no",
  "whatsapp_no",
  "phone",
  "phone_ext",
  "company_name",
  "no_of_employees",
  "annual_revenue",
  "industry",
  "market_segment",
  "city",
  "state",
  "country",
  "territory",
  "lead_owner",
  "company",
  "qualification_status",
];
const CHECKBOX_KEYS = ["disabled", "unsubscribed"];

/**
 * Lead has no field that's `reqd: 1` server-side other than `status` (which always has a
 * default and is never edited through this form directly — see updateLeadStatusAction) —
 * live-verified via a direct DocType JSON read, CRM-1 package. ERPNext itself even accepts
 * a company-only Lead with no first_name (live-tested against a disposable fixture this
 * session). This validation is a Ceylon Stack-side product judgement call, not an ERPNext
 * requirement: a Lead needs *some* identity to be useful — either a person's name or an
 * organization name — so this is the one thing the frontend itself insists on.
 */
function validate(fields: Record<string, unknown>): string | undefined {
  if (!fields.first_name && !fields.company_name) {
    return "Enter either a contact name or an organization name.";
  }
  return undefined;
}

export async function createLeadAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const fields = fieldsFromFormData(formData, TEXT_KEYS, CHECKBOX_KEYS);
  const error = validate(fields);
  if (error) return { error };

  let name: string;
  try {
    const doc = await createDoc<{ name: string }>("Lead", fields);
    name = doc.name;
  } catch (e) {
    return { error: humanizeError(e, "lead") };
  }

  revalidatePath("/crm/leads");
  redirect(`/crm/leads/${encodeURIComponent(name)}`);
}

export async function updateLeadAction(
  name: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const fields = fieldsFromFormData(formData, TEXT_KEYS, CHECKBOX_KEYS);
  const error = validate(fields);
  if (error) return { error };

  try {
    await updateDoc("Lead", name, fields);
  } catch (e) {
    return { error: humanizeError(e, "lead") };
  }

  revalidatePath("/crm/leads");
  revalidatePath(`/crm/leads/${encodeURIComponent(name)}`);
  redirect(`/crm/leads/${encodeURIComponent(name)}?saved=1`);
}

/**
 * Lead's `status` Select enum includes `Opportunity`/`Quotation`/`Converted` as valid
 * *stored* values, but per `docs/backend/16-crm/crm-architecture.md` §6 (source-verified),
 * ERPNext itself never sets them automatically — only this app's own conversion actions
 * do (`lib/actions/leadConversion.ts`). Manually offering them here would let a user set
 * "Converted" on a Lead with no actual Customer behind it, so this allowlist deliberately
 * excludes them — a Ceylon Stack UX decision, not an ERPNext-enforced rule (ERPNext's own
 * `status` field has no transition validation at all, confirmed in the same section).
 */
export async function updateLeadStatusAction(
  name: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const status = String(formData.get("status") ?? "");
  if (!MANUAL_LEAD_STATUS_OPTIONS.includes(status)) {
    return { error: "Not a valid manual status." };
  }

  try {
    await updateDoc("Lead", name, { status }, "update Lead status");
  } catch (e) {
    return { error: humanizeError(e, "lead") };
  }

  revalidatePath("/crm/leads");
  revalidatePath(`/crm/leads/${encodeURIComponent(name)}`);
  redirect(`/crm/leads/${encodeURIComponent(name)}?saved=1`);
}
