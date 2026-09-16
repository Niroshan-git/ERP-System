"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cancelDoc, createDoc, ErpNextError, submitDoc, updateDoc } from "@/lib/erpnext";

export type FormState = { error?: string } | undefined;

function humanizeError(e: unknown): string {
  if (e instanceof ErpNextError) {
    if (e.status === 403) return "Not allowed to save this material request.";
    if (e.status === 409) return "A material request with that name already exists.";
    return e.erpnextMessage ?? "ERPNext rejected this material request — check the required fields.";
  }
  return "Something went wrong. Try again.";
}

type MaterialRequestItemInput = {
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  conversion_factor: number;
  schedule_date: string;
};

/**
 * Deliberately not lib/lineRows.ts's parseLineRows — that shape assumes a `rate` field
 * always exists, but Material Request Item has no rate/amount concept at all (confirmed
 * via the live DocType JSON). This parses the same LineItemsEditor hidden-JSON field but
 * only forwards the fields that are actually real on this child table, plus the per-line
 * `schedule_date` LineItemsEditor's `showScheduleDate` mode adds.
 *
 * `conversion_factor` is hard-coded to 1 — this app doesn't expose a separate purchase UOM
 * from the stock UOM (same single-UOM simplification Quotation/Sales Order already make
 * with `conversion_rate: 1`), so qty is always entered directly in the stock UOM.
 */
function parseMaterialRequestItems(formData: FormData): MaterialRequestItemInput[] {
  const raw = String(formData.get("items") ?? "[]");
  let rows: unknown;
  try {
    rows = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(rows)) return [];

  return rows
    .filter((r): r is Record<string, unknown> => Boolean(r && typeof r === "object" && r.item_code))
    .map((r) => ({
      item_code: String(r.item_code),
      item_name: String(r.item_name || r.item_code),
      qty: Number(r.qty) || 0,
      uom: String(r.uom || ""),
      conversion_factor: 1,
      schedule_date: String(r.schedule_date || ""),
    }))
    .filter((r) => r.qty > 0 && r.uom && r.schedule_date);
}

async function buildMaterialRequestFields(formData: FormData) {
  const company = String(formData.get("company") ?? "").trim();
  const transaction_date = String(formData.get("transaction_date") ?? "").trim();
  const schedule_date = String(formData.get("schedule_date") ?? "").trim() || undefined;

  if (!company) throw new Error("Company is required.");
  if (!transaction_date) throw new Error("Date is required.");

  const items = parseMaterialRequestItems(formData);
  if (items.length === 0) throw new Error("Add at least one item with a quantity, UOM, and required-by date.");

  return {
    // Purchase-only tool — never read from the form, never exposed to the user (see
    // MaterialRequestForm.tsx's own doc comment and the plan this build followed).
    material_request_type: "Purchase",
    company,
    transaction_date,
    schedule_date,
    items,
  };
}

export async function createMaterialRequestAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  let fields: Awaited<ReturnType<typeof buildMaterialRequestFields>>;
  try {
    fields = await buildMaterialRequestFields(formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid form input." };
  }

  let name: string;
  try {
    const doc = await createDoc<{ name: string }>("Material Request", fields);
    name = doc.name;
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/buying/material-requests");
  redirect(`/buying/material-requests/${encodeURIComponent(name)}`);
}

export async function updateMaterialRequestAction(
  name: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  let fields: Awaited<ReturnType<typeof buildMaterialRequestFields>>;
  try {
    fields = await buildMaterialRequestFields(formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid form input." };
  }

  try {
    await updateDoc("Material Request", name, fields);
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/buying/material-requests");
  revalidatePath(`/buying/material-requests/${encodeURIComponent(name)}`);
  redirect(`/buying/material-requests/${encodeURIComponent(name)}?saved=1`);
}

/** Bound to `(name)`; useActionState calls the bound function with (state, formData) which are unused here. */
export async function submitMaterialRequestAction(name: string): Promise<FormState> {
  try {
    await submitDoc("Material Request", name);
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/buying/material-requests");
  revalidatePath(`/buying/material-requests/${encodeURIComponent(name)}`);
  redirect(`/buying/material-requests/${encodeURIComponent(name)}`);
}

/** Bound to `(name)`; useActionState calls the bound function with (state, formData) which are unused here. */
export async function cancelMaterialRequestAction(name: string): Promise<FormState> {
  try {
    await cancelDoc("Material Request", name);
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/buying/material-requests");
  revalidatePath(`/buying/material-requests/${encodeURIComponent(name)}`);
  redirect(`/buying/material-requests/${encodeURIComponent(name)}`);
}
