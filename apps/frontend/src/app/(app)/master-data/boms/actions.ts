"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createDoc, ErpNextError, getDoc, updateDoc } from "@/lib/erpnext";
import { parseBomComponentRows, parseBomOperationRows } from "@/lib/bomRows";

export type FormState = { error?: string } | undefined;

function humanizeError(e: unknown): string {
  if (e instanceof ErpNextError) {
    if (e.status === 403) return "Not allowed to save this BOM.";
    if (e.status === 409) return "A BOM with that name already exists.";
    return e.erpnextMessage ?? "ERPNext rejected this BOM — check the required fields.";
  }
  return "Something went wrong. Try again.";
}

function checked(formData: FormData, name: string): 0 | 1 {
  return formData.get(name) === "on" ? 1 : 0;
}

/**
 * Builds the createDoc/updateDoc payload from BomForm's fields. Mirrors
 * buying/purchase-orders/actions.ts's buildPurchaseOrderFields shape — header fields parsed
 * directly off the form, child tables parsed via lib/bomRows.ts (same hidden-JSON-field
 * technique lib/lineRows.ts already established). ERPNext itself computes costing
 * (raw_material_cost/operating_cost/total_cost) and stock_qty/conversion_factor/base_rate/
 * base_amount on insert/save — none of those are sent here, matching this package's
 * "backend-authoritative costing" boundary.
 */
async function buildBomFields(formData: FormData) {
  const item = String(formData.get("item") ?? "").trim();
  const item_name = String(formData.get("item_name") ?? "").trim() || undefined;
  const company = String(formData.get("company") ?? "").trim();
  const quantity = Number(formData.get("quantity")) || 0;
  const uom = String(formData.get("uom") ?? "").trim() || undefined;
  const currency = String(formData.get("currency") ?? "").trim();
  const conversion_rate = Number(formData.get("conversion_rate")) || 1;
  const with_operations = checked(formData, "with_operations");
  const routing = String(formData.get("routing") ?? "").trim() || undefined;
  const transfer_material_against = String(formData.get("transfer_material_against") ?? "").trim() || undefined;
  const default_source_warehouse = String(formData.get("default_source_warehouse") ?? "").trim() || undefined;
  const default_target_warehouse = String(formData.get("default_target_warehouse") ?? "").trim() || undefined;

  if (!item) throw new Error("Item to Manufacture is required.");
  if (!company) throw new Error("Company is required.");
  if (quantity <= 0) throw new Error("Quantity must be greater than zero.");
  if (!currency) throw new Error("Currency is required.");

  const items = parseBomComponentRows(formData, "components");
  if (items.length === 0) {
    throw new Error("Add at least one component with a quantity and UOM.");
  }

  const operations = with_operations ? parseBomOperationRows(formData, "operations") : [];
  if (with_operations && operations.length === 0) {
    throw new Error('Add at least one operation, or turn off "With Operations".');
  }

  return {
    item,
    item_name,
    company,
    quantity,
    uom,
    currency,
    conversion_rate,
    with_operations,
    is_active: checked(formData, "is_active"),
    is_default: checked(formData, "is_default"),
    allow_alternative_item: checked(formData, "allow_alternative_item"),
    is_phantom_bom: checked(formData, "is_phantom_bom"),
    track_semi_finished_goods: checked(formData, "track_semi_finished_goods"),
    inspection_required: checked(formData, "inspection_required"),
    routing,
    transfer_material_against,
    default_source_warehouse,
    default_target_warehouse,
    items,
    operations,
  };
}

export async function createBomAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  let fields: Awaited<ReturnType<typeof buildBomFields>>;
  try {
    fields = await buildBomFields(formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid form input." };
  }

  let name: string;
  try {
    const doc = await createDoc<{ name: string }>("BOM", fields);
    name = doc.name;
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/master-data/boms");
  redirect(`/master-data/boms/${encodeURIComponent(name)}`);
}

/**
 * Draft-only, re-checked server-side against a fresh read of the BOM rather than trusting
 * the page that rendered the form — same defense-in-depth lesson `CX-MFG-001` recorded for
 * Material Transfer (never trust client-posted state for something the backend's own
 * lifecycle rules gate). ERPNext's own core convention treats a submitted document as
 * immutable except via amend; this frontend does not independently verify that rejection
 * message this session (no write-testing credentials — see MFG-UNV-009/`docs/backend/
 * 05-manufacturing/bom.md`), so this check is this app's own safety net, not a substitute
 * for ERPNext's real server-side enforcement.
 */
export async function updateBomAction(name: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  let current: { docstatus: number };
  try {
    current = await getDoc<{ docstatus: number }>("BOM", name);
  } catch {
    return { error: "Could not load this BOM." };
  }
  if (current.docstatus !== 0) {
    return { error: "Only a Draft BOM can be edited here." };
  }

  let fields: Awaited<ReturnType<typeof buildBomFields>>;
  try {
    fields = await buildBomFields(formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid form input." };
  }

  try {
    await updateDoc("BOM", name, fields);
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/master-data/boms");
  revalidatePath(`/master-data/boms/${encodeURIComponent(name)}`);
  redirect(`/master-data/boms/${encodeURIComponent(name)}?saved=1`);
}
