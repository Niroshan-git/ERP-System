"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cancelDoc, createDoc, ErpNextError, getDoc, submitDoc } from "@/lib/erpnext";
import { getConnections } from "@/lib/connections";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import {
  parseProductionPlanItemRows,
  parseProductionPlanMaterialRequestRows,
  parseProductionPlanReferenceRows,
  parseProductionPlanSalesOrderRows,
} from "@/lib/productionPlanRows";

export type FormState = { error?: string } | undefined;

function humanizeError(e: unknown): string {
  if (e instanceof ErpNextError) {
    if (e.status === 403) return "Not allowed to save this production plan.";
    if (e.status === 409) return "A production plan with that name already exists.";
    return e.erpnextMessage ?? "ERPNext rejected this production plan — check the required fields.";
  }
  return "Something went wrong. Try again.";
}

function checked(formData: FormData, name: string): 0 | 1 {
  return formData.get(name) === "on" ? 1 : 0;
}

function buildProductionPlanFields(formData: FormData) {
  const company = String(formData.get("company") ?? "").trim();
  const posting_date = String(formData.get("posting_date") ?? "").trim();
  const get_items_from = String(formData.get("get_items_from") ?? "").trim();

  if (!company) throw new Error("Company is required.");
  if (!posting_date) throw new Error("Posting date is required.");
  if (get_items_from !== "Sales Order" && get_items_from !== "Material Request") {
    throw new Error('Get Items From must be "Sales Order" or "Material Request".');
  }

  const po_items = parseProductionPlanItemRows(formData);
  if (po_items.length === 0) {
    throw new Error('Add at least one finished-goods row — use "Get Finished Goods" first.');
  }

  return {
    company,
    posting_date,
    get_items_from,
    combine_items: checked(formData, "combine_items"),
    sales_orders: parseProductionPlanSalesOrderRows(formData),
    material_requests: parseProductionPlanMaterialRequestRows(formData),
    po_items,
    prod_plan_references: parseProductionPlanReferenceRows(formData),
  };
}

/**
 * Create-only — leaves the Production Plan at docstatus 0 (Draft), matching this app's
 * standing Work Order/BOM create precedent (`FRONTEND_GUIDE.md` §11). No submit/cancel, no
 * "Get Sub Assembly Items"/raw-material calc, no "Make Work Order"/"Make Material Request" —
 * all deferred to a future package, per PP-2's own scope split (see PROGRESS.md). `sales_orders`
 * /`material_requests`/`po_items`/`prod_plan_references` were built up client-side via
 * ERPNext's own native `get_open_sales_orders`/`get_pending_material_requests`/
 * `combine_so_items` (see `lib/actions/productionPlanCreate.ts`) — this action only persists
 * whatever that flow already produced, matching `createWorkOrderAction`'s "trust the preview,
 * don't recompute it" precedent. Session-checked because, unlike the read-only preview calls,
 * this one actually creates a document (same pattern as `comments.ts`'s `postCommentAction`).
 */
export async function createProductionPlanAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const cookieStore = await cookies();
  const session = await verifySession(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session) return { error: "Your session expired — reload the page." };

  let fields: ReturnType<typeof buildProductionPlanFields>;
  try {
    fields = buildProductionPlanFields(formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid form input." };
  }

  let name: string;
  try {
    const doc = await createDoc<{ name: string }>("Production Plan", fields);
    name = doc.name;
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/manufacturing/production-plans");
  redirect(`/manufacturing/production-plans/${encodeURIComponent(name)}`);
}

/**
 * docstatus 0→1 via ERPNext's own native submit — same `submitDoc` mechanism already used for
 * Sales Order/Purchase Order/Work Order/etc. (`lib/erpnext.ts`), which runs the doctype's full
 * `validate()`/`on_submit()` server-side; nothing here re-implements or second-guesses that
 * logic. Per PP-3 discovery (`docs/backend/05-manufacturing/production-plan.md`'s "Submit
 * lifecycle" section, source-read from `frappe/erpnext`'s `production_plan.py`), `on_submit()`
 * runs `update_bin_qty()` (Bin reserved-qty write, only for populated `mr_items`/
 * `sub_assembly_items` rows — both empty for every Production Plan this app can currently
 * create, since Get Sub Assembly Items/raw-material calc remain out of scope), `update_sales_order()`
 * (writes `production_plan_qty` back onto the source Sales Order Item — the one real, always-
 * possible side effect for an app-created Sales-Order-sourced plan), `add_reference_to_raw_materials()`
 * (no-op on an empty `mr_items`), and `update_stock_reservation()` (no-op unless `reserve_stock`
 * is checked, which this app's create form never sets). No Work Order, Material Request, or
 * Purchase Order is created by submit itself — those remain separate, still-locked "Make ..."
 * actions gated to `docstatus === 1` in ERPNext's own client script, not invoked here.
 *
 * Bound to `(name)`; useActionState calls the bound function with (state, formData) which are
 * unused here — same shape as every other doctype's submit action in this app.
 */
export async function submitProductionPlanAction(name: string): Promise<FormState> {
  try {
    await submitDoc("Production Plan", name);
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/manufacturing/production-plans");
  revalidatePath(`/manufacturing/production-plans/${encodeURIComponent(name)}`);
  redirect(`/manufacturing/production-plans/${encodeURIComponent(name)}`);
}

/**
 * docstatus 1→2 via ERPNext's own native cancel (`cancelDoc`, the same generic mechanism already
 * used by `cancelPurchaseOrderAction`/`cancelSalesOrderAction`/every other cancellable doctype in
 * this app) — no bespoke cancellation logic. PP-8's own investigation (see
 * `docs/backend/05-manufacturing/production-plan.md`'s "Cancel (PP-8)" section) found
 * `on_cancel()` auto-deletes any still-Draft Work Order the plan generated
 * (`delete_draft_work_order()`, live-confirmed PP-5) but has no equivalent step for Material
 * Request or subcontract Purchase Order, and a *Submitted* Work Order/Material Request/Purchase
 * Order blocks cancellation via Frappe's generic `LinkExistsError` (the same
 * `check_if_doc_is_linked` mechanism `lib/connections.ts`'s own doc comment already documents).
 *
 * Re-fetches the document and independently re-checks `docstatus === 1` fresh, rather than
 * trusting the page that rendered the button — same defense-in-depth precedent as every other
 * Production Plan action in this file/`lib/actions/`. The downstream check re-derives
 * `getConnections("Production Plan", name)` itself (not a value passed in from the caller), for
 * the same reason: a client-supplied "no blockers" claim is not evidence.
 *
 * Mirrors `cancelPurchaseOrderAction`'s exact shape (`buying/purchase-orders/actions.ts`): name
 * every blocking submitted document instead of surfacing ERPNext's raw `LinkExistsError` text.
 * Never attempts to cancel/delete the blocking documents itself — resolving them is a separate
 * business operation, not something this action performs on the user's behalf.
 */
export async function cancelProductionPlanAction(name: string): Promise<FormState> {
  const doc = await getDoc<{ name: string; docstatus: 0 | 1 | 2 }>("Production Plan", name);
  if (doc.docstatus !== 1) {
    return { error: "Only a Submitted production plan can be cancelled." };
  }

  const connections = await getConnections("Production Plan", name);
  const blocking = connections.flatMap((c) => c.submittedDocs ?? []);
  if (blocking.length > 0) {
    return {
      error: `Cannot cancel — linked with ${blocking.join(", ")}. Cancel those first.`,
    };
  }

  try {
    await cancelDoc("Production Plan", name);
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/manufacturing/production-plans");
  revalidatePath(`/manufacturing/production-plans/${encodeURIComponent(name)}`);
  redirect(`/manufacturing/production-plans/${encodeURIComponent(name)}`);
}
