"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cancelDoc, createDoc, ErpNextError, getDoc, submitDoc, updateDoc } from "@/lib/erpnext";
import { getConnections } from "@/lib/connections";
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

/**
 * Passes ERPNext's own rejection text through mostly untouched (unlike `humanizeError`'s
 * "check the required fields" framing, which doesn't fit a cancel). Covers two distinct
 * server-side rejections a BOM cancel can hit, neither reimplemented client-side (MFG-CLOSE-2
 * source investigation — see `docs/backend/05-manufacturing/bom.md`'s Cancel/Amend contract):
 * Frappe's generic `LinkExistsError` (a submitted document this app didn't proactively check
 * still references the BOM) and BOM's own `validate_bom_links()` ("Cannot deactivate or cancel
 * BOM as it is linked with other BOMs" — the sub-assembly case, source-quoted in bom.py, no
 * dedicated status code, just `e.erpnextMessage`).
 */
function humanizeCancelError(e: unknown): string {
  if (e instanceof ErpNextError) {
    if (e.status === 403) return "Not allowed to cancel this BOM.";
    return e.erpnextMessage ?? "ERPNext rejected this cancellation.";
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

/**
 * docstatus 1→2 via ERPNext's own native cancel (`cancelDoc`, the same generic mechanism
 * `cancelSalesOrderAction`/`cancelProductionPlanAction`/`cancelPurchaseOrderAction` already use)
 * — no bespoke cancellation logic. MFG-CLOSE-2's own source investigation (`bom.py`'s
 * `on_cancel()`, quoted in `docs/backend/05-manufacturing/bom.md`'s Cancel/Amend contract) found
 * it unsets `is_active`/`is_default`, clears `Item.default_bom` when this was the default, and
 * runs `validate_bom_links()` (blocks cancel if an *active, submitted* parent BOM still uses this
 * one as a sub-assembly component — a BOM-specific check, distinct from the generic Frappe
 * back-link scan below).
 *
 * Re-fetches the BOM and independently re-checks `docstatus === 1` fresh, rather than trusting
 * the page that rendered the button — same defense-in-depth precedent as every other action in
 * this file. The downstream Work Order check re-derives `getConnections("BOM", name)` itself
 * (not a value passed in from the caller), for the same reason a client-supplied "no blockers"
 * claim is not evidence — mirrors `cancelProductionPlanAction`'s exact shape. Only Work Order is
 * checked proactively (see `lib/connections.ts`'s new "BOM" entry doc comment for why); every
 * other doctype Frappe's generic link check could name, plus the sub-assembly case, surfaces via
 * `humanizeCancelError`'s pass-through of ERPNext's own message instead of being duplicated here.
 */
export async function cancelBomAction(name: string): Promise<FormState> {
  let current: { docstatus: number };
  try {
    current = await getDoc<{ docstatus: number }>("BOM", name);
  } catch {
    return { error: "Could not load this BOM." };
  }
  if (current.docstatus !== 1) {
    return { error: "Only a submitted BOM can be cancelled." };
  }

  const connections = await getConnections("BOM", name);
  const blocking = connections.flatMap((c) => c.submittedDocs ?? []);
  if (blocking.length > 0) {
    return {
      error: `Cannot cancel — linked with Work Order ${blocking.join(", ")}. Cancel those first.`,
    };
  }

  try {
    await cancelDoc("BOM", name);
  } catch (e) {
    return { error: humanizeCancelError(e) };
  }

  revalidatePath("/master-data/boms");
  revalidatePath(`/master-data/boms/${encodeURIComponent(name)}`);
  redirect(`/master-data/boms/${encodeURIComponent(name)}?saved=1`);
}

/** Full-fidelity read of a cancelled BOM, used only to build `amendBomAction`'s copy payload —
 * deliberately the same curated field set `buildBomFields`/the Mutation contract already send on
 * create/update (never the computed fields ERPNext derives itself: `stock_qty`, `base_rate`,
 * `amount`, costing, etc.), not the full schema. */
type BomForAmend = {
  docstatus: 0 | 1 | 2;
  item: string;
  item_name?: string;
  company: string;
  quantity: number;
  uom?: string;
  currency: string;
  conversion_rate?: number;
  with_operations: 0 | 1;
  is_active: 0 | 1;
  is_default: 0 | 1;
  allow_alternative_item?: 0 | 1;
  is_phantom_bom?: 0 | 1;
  track_semi_finished_goods?: 0 | 1;
  inspection_required?: 0 | 1;
  routing?: string;
  transfer_material_against?: string;
  default_source_warehouse?: string;
  default_target_warehouse?: string;
  items?: Array<{
    item_code: string;
    item_name?: string;
    qty: number;
    uom: string;
    rate?: number;
    source_warehouse?: string;
    operation?: string;
    bom_no?: string;
    allow_alternative_item?: 0 | 1;
  }>;
  operations?: Array<{
    operation: string;
    workstation?: string;
    time_in_mins?: number;
    batch_size?: number;
    hour_rate?: number;
    description?: string;
  }>;
};

/**
 * docstatus 2 -> a brand-new Draft BOM with `amended_from` set, via ERPNext's own generic amend
 * pattern (MFG-CLOSE-2 source investigation: no dedicated server endpoint exists for amend
 * anywhere in `bom.py` — Desk's own "Amend" button just clones the document client-side and calls
 * ordinary `insert()`; this action reproduces exactly that, server-side, from a fresh re-fetch
 * rather than trusting anything the client posted). Live-verified (`docs/backend/05-manufacturing/
 * bom.md`'s "Cancel/Amend contract"): `BOM.autoname()`'s `BOM-<ITEM>-<NNN>` scheme is never reached
 * for an amended document on this instance — Frappe's own `set_new_name()` short-circuits first via
 * the site-wide `Document Naming Settings.default_amend_naming` ("Amend Counter" here), naming the
 * new Draft `<cancelled-name>-<counter>` instead. Either way this action never predicts or depends
 * on the resulting name — it always reads it back from `createDoc`'s own response.
 *
 * Copies exactly the header/component/operation field set `buildBomFields` already sends on
 * create — never the cancelled doc's computed costing/`stock_qty`/`base_rate`/etc. fields, same
 * backend-authoritative-costing boundary as create/update. `is_active`/`is_default` on the
 * cancelled source are already `0`/`0` (set by `on_cancel`, per the Cancel contract above), so
 * copying them verbatim needs no special-casing — the new Draft naturally starts Inactive/
 * non-Default, same as `BomForm`'s own real default checkbox state on create.
 *
 * Redirects to the new Draft's plain detail page, not straight into edit mode — matches this
 * app's existing create-flow convention (`createBomAction`) and the established "Edit BOM" is an
 * explicit opt-in action, not automatic (`CX-MFG-BOM-4B-002`).
 */
export async function amendBomAction(name: string): Promise<FormState> {
  let source: BomForAmend;
  try {
    source = await getDoc<BomForAmend>("BOM", name);
  } catch {
    return { error: "Could not load this BOM." };
  }
  if (source.docstatus !== 2) {
    return { error: "Only a Cancelled BOM can be amended." };
  }

  const fields = {
    item: source.item,
    item_name: source.item_name,
    company: source.company,
    quantity: source.quantity,
    uom: source.uom,
    currency: source.currency,
    conversion_rate: source.conversion_rate ?? 1,
    with_operations: source.with_operations,
    is_active: source.is_active,
    is_default: source.is_default,
    allow_alternative_item: source.allow_alternative_item ?? 0,
    is_phantom_bom: source.is_phantom_bom ?? 0,
    track_semi_finished_goods: source.track_semi_finished_goods ?? 0,
    inspection_required: source.inspection_required ?? 0,
    routing: source.routing,
    transfer_material_against: source.transfer_material_against,
    default_source_warehouse: source.default_source_warehouse,
    default_target_warehouse: source.default_target_warehouse,
    amended_from: name,
    items: (source.items ?? []).map((i) => ({
      item_code: i.item_code,
      item_name: i.item_name,
      qty: i.qty,
      uom: i.uom,
      rate: i.rate ?? 0,
      source_warehouse: i.source_warehouse,
      operation: i.operation,
      bom_no: i.bom_no,
      allow_alternative_item: i.allow_alternative_item ?? 0,
    })),
    operations: (source.operations ?? []).map((o) => ({
      operation: o.operation,
      workstation: o.workstation,
      time_in_mins: o.time_in_mins ?? 0,
      batch_size: o.batch_size,
      hour_rate: o.hour_rate,
      description: o.description,
    })),
  };

  let newName: string;
  try {
    const doc = await createDoc<{ name: string }>("BOM", fields);
    newName = doc.name;
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/master-data/boms");
  revalidatePath(`/master-data/boms/${encodeURIComponent(name)}`);
  redirect(`/master-data/boms/${encodeURIComponent(newName)}`);
}
