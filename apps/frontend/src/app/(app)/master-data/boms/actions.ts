"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createDoc, ErpNextError, getDoc, submitDoc, updateDoc } from "@/lib/erpnext";
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

function humanizeSubmitError(e: unknown): string {
  if (e instanceof ErpNextError) {
    if (e.status === 403) return "Not allowed to submit this BOM.";
    return e.erpnextMessage ?? "ERPNext rejected this submission — check the required fields.";
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

/**
 * docstatus 0→1 via ERPNext's own native submit (`submitDoc`, the same generic mechanism
 * already used for Sales Order/Purchase Order/Work Order/Production Plan — `lib/erpnext.ts`),
 * which runs `BOM.validate()`/`BOM.on_submit()` server-side; nothing here re-implements or
 * pre-validates that logic client-side (`MFG-CLOSE-0c`'s governing architecture rule: ERPNext
 * owns BOM lifecycle, this app only orchestrates it).
 *
 * Re-fetches the BOM and re-checks `docstatus === 0` itself before calling `submitDoc` — unlike
 * `submitWorkOrderAction`/`submitProductionPlanAction`, which submit directly and let ERPNext's
 * own docstatus-transition guard reject an already-submitted document. This action adds that
 * extra server-side check deliberately (this package's own explicit stale-state requirement,
 * matching `updateBomAction`'s existing re-fetch-before-write precedent in this same file): the
 * page that renders the Submit button cannot be trusted as proof the BOM is still Draft if
 * another session submitted it in the meantime, and a named "Only a Draft BOM can be submitted"
 * message is friendlier than ERPNext's raw transition-error text either way.
 *
 * **Live-confirmed native side effect worth knowing, not something this action controls or
 * should try to prevent** (`bom.py`'s `on_submit()` → `manage_default_bom()`, MFG-CLOSE-0c
 * investigation): if this is the *first* Submitted+Active BOM for its item, ERPNext
 * automatically sets `is_default = 1` and `Item.default_bom` to this BOM — even though
 * `BomForm`'s "Is Default" checkbox defaults unchecked and nothing here requests it. This is
 * ERPNext's own native `manage_default_bom()` behavior on every submit, not a Ceylon Stack
 * design choice, and is not suppressed or special-cased here, consistent with this package's
 * "don't recreate BOM lifecycle rules" boundary. A second/third BOM for the same item does not
 * get this treatment (it only fires when no other submitted default already exists for the
 * item) — `setDefaultBomAction` remains the explicit way to change the default afterward.
 */
export async function submitBomAction(name: string): Promise<FormState> {
  let current: { docstatus: number };
  try {
    current = await getDoc<{ docstatus: number }>("BOM", name);
  } catch {
    return { error: "Could not load this BOM." };
  }
  if (current.docstatus !== 0) {
    return { error: "Only a Draft BOM can be submitted." };
  }

  try {
    await submitDoc("BOM", name);
  } catch (e) {
    return { error: humanizeSubmitError(e) };
  }

  revalidatePath("/master-data/boms");
  revalidatePath(`/master-data/boms/${encodeURIComponent(name)}`);
  redirect(`/master-data/boms/${encodeURIComponent(name)}?saved=1`);
}

/**
 * Narrow availability mutation for a *submitted* BOM — CX-MFG-BOM-4B-001 remediation.
 * ERPNext marks `is_active`/`is_default` `allow_on_submit: 1` on the BOM DocType and runs
 * `manage_default_bom()` on update-after-submit (verified 2026-09-19, see
 * `docs/backend/05-manufacturing/bom.md`), so a submitted BOM's availability/default state is
 * legitimately editable without cancel/amend — but only these two fields, never the structural
 * ones `updateBomAction`/`BomForm` control. Never trust the page that rendered the button: this
 * re-fetches the BOM itself, rejects anything not currently submitted, and only ever sends the
 * exact `fields` object this module constructs — nothing from `formData` reaches `updateDoc`, so
 * there is no path for a caller to smuggle `item`/`items`/`operations`/other structural fields
 * through this action.
 */
async function setBomAvailability(name: string, fields: { is_active: 0 | 1 } | { is_default: 1 }): Promise<FormState> {
  let current: { docstatus: number; is_active: 0 | 1 };
  try {
    current = await getDoc<{ docstatus: number; is_active: 0 | 1 }>("BOM", name);
  } catch {
    return { error: "Could not load this BOM." };
  }
  if (current.docstatus !== 1) {
    return { error: "Only a submitted BOM's availability can be changed here." };
  }
  if ("is_default" in fields && !current.is_active) {
    return { error: "Only an Active BOM can be set as Default." };
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

/** Bound to `(name)` by the page; DocActionBar calls the bound function with (state, formData), same as `cancelSalesOrderAction`/`submitSalesOrderAction` elsewhere — both unused and, since neither is declared here, no lint noise from them either. */
export async function activateBomAction(name: string): Promise<FormState> {
  return setBomAvailability(name, { is_active: 1 });
}

export async function deactivateBomAction(name: string): Promise<FormState> {
  return setBomAvailability(name, { is_active: 0 });
}

/**
 * Only ever sends `is_default: 1` — never `0`. ERPNext's own `manage_default_bom()` clears the
 * previous default (and updates `Item.default_bom`) as part of processing this update; this app
 * does not compute or send that "unset the old one" step itself (see CLAUDE remediation §8 —
 * backend is authoritative for the resulting default set, not frontend-guessed).
 */
export async function setDefaultBomAction(name: string): Promise<FormState> {
  return setBomAvailability(name, { is_default: 1 });
}
