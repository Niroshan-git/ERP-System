"use server";

import { revalidatePath } from "next/cache";
import { callMethodWithResult, callRunDocMethod, ErpNextError, getDoc, updateDoc } from "@/lib/erpnext";
import {
  parseProductionPlanMaterialRequestPlanItemRows,
  parseProductionPlanSubAssemblyItemRows,
  type ProductionPlanMaterialRequestPlanItemRowInput,
  type ProductionPlanSubAssemblyItemRowInput,
} from "@/lib/productionPlanRows";

/** Same unwrap as `productionPlanCreate.ts`'s own `callAndHumanize` — `ErpNextError` can't
 * cross the Server Function → Client Component boundary intact, only `Error.message` does. */
async function callAndHumanize<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ErpNextError) {
      throw new Error(e.erpnextMessage ?? `ERPNext rejected the request (${e.status}).`);
    }
    throw e;
  }
}

type DraftSnapshot = Record<string, unknown> & { name: string; docstatus: 0 | 1 | 2 };

/** Never trust the page that rendered the button — re-fetch the real document and confirm it's
 * still Draft before running a native planning method or persisting its result. Same
 * defense-in-depth precedent as `updateBomAction` (`master-data/boms/actions.ts`). Both "Get Sub
 * Assembly Items" and "Get Items for Purchase Only" are Draft-only on the real ERPNext instance
 * (`depends_on: ...doc.docstatus == 0` — see production-plan.md's "Button/action visibility by
 * docstatus" table), a Desk-level convention this app enforces itself since the underlying
 * whitelisted methods carry no server-side docstatus assertion of their own. */
async function loadDraftOrThrow(name: string): Promise<DraftSnapshot> {
  const doc = await getDoc<DraftSnapshot>("Production Plan", name);
  if (doc.docstatus !== 0) {
    throw new Error("Only a Draft Production Plan can be re-planned here.");
  }
  return doc;
}

export type SubAssemblyOptions = {
  sub_assembly_warehouse?: string;
  skip_available_sub_assembly_item?: 0 | 1;
  combine_sub_items?: 0 | 1;
};

/**
 * "Get Sub Assembly Items" preview (PP-4) — native, Document-bound `get_sub_assembly_items`
 * (source: `services/sub_assembly.py`'s `SubAssemblyService`, confirmed 2026-09-20 against
 * `frappe/erpnext`). BOM explosion is entirely server-side; this never recomputes it. Confirmed
 * **in-memory only** — `SubAssemblyService.get_sub_assembly_items` only appends to
 * `self.doc.sub_assembly_items`, no `frappe.db`/`.save()` call anywhere in it or
 * `sub_assembly_queries.py`'s explosion helpers — matching Desk's own `production_plan.js`
 * (`frm.dirty()` before the call, no auto-save after). Nothing is persisted by this call; the
 * caller must invoke `saveSubAssemblyItemsAction` separately to keep the result.
 *
 * Reuses `callRunDocMethod` (`lib/erpnext.ts`) exactly as PP-2 did, extended here to an
 * **existing saved** Draft rather than an unsaved one — no new lib/erpnext.ts helper needed:
 * per that function's own doc comment (source-read from `frappe/handler.py`'s
 * `run_doc_method`), `frappe.get_doc(docs, check_permission=True)` always builds its in-memory
 * Document from the given payload dict, never touching the DB for a fetch, regardless of
 * whether the payload's `name` happens to match a real saved document — so passing the freshly
 * fetched real doc (real `name`, no `__islocal`/`__unsaved`) works the same way PP-2's
 * placeholder-name payload did.
 */
export async function getSubAssemblyItemsPreview(
  name: string,
  options: SubAssemblyOptions,
): Promise<ProductionPlanSubAssemblyItemRowInput[]> {
  const draft = await loadDraftOrThrow(name);
  const payload = { ...draft, ...options };
  const result = await callAndHumanize(() =>
    callRunDocMethod<{ sub_assembly_items?: unknown }>(payload, "get_sub_assembly_items"),
  );
  return parseProductionPlanSubAssemblyItemRows(result.sub_assembly_items);
}

/**
 * Persists a previewed `sub_assembly_items` result (plus the options that produced it) onto the
 * real Draft — a plain field-update `PUT`, the same `updateDoc` mechanism every other
 * editable-field save in this app uses. Re-checks Draft status fresh rather than trusting the
 * caller (see `loadDraftOrThrow`). Full-table replace, matching ERPNext's own semantics: native
 * `get_sub_assembly_items` clears `sub_assembly_items` before rebuilding it on every call, so
 * this app does the same rather than attempting a merge.
 */
export async function saveSubAssemblyItemsAction(
  name: string,
  options: SubAssemblyOptions,
  rows: ProductionPlanSubAssemblyItemRowInput[],
): Promise<void> {
  await loadDraftOrThrow(name);
  await callAndHumanize(() => updateDoc("Production Plan", name, { ...options, sub_assembly_items: rows }));
  revalidatePath(`/manufacturing/production-plans/${encodeURIComponent(name)}`);
}

export type MaterialRequirementOptions = {
  for_warehouse: string;
  ignore_existing_ordered_qty?: 0 | 1;
  include_non_stock_items?: 0 | 1;
  consider_minimum_order_qty?: 0 | 1;
  include_safety_stock?: 0 | 1;
};

/**
 * "Get Items for Purchase Only" preview (PP-4) — native, **module-level** `get_items_for_
 * material_requests` (source: `services/material_request.py`, confirmed 2026-09-20). Unlike
 * `get_sub_assembly_items` above, this is a free-standing `@frappe.whitelist()` function, not a
 * Document-bound method — Desk itself calls it via the generic dotted-path boundary
 * (`erpnext.manufacturing.doctype.production_plan.production_plan.get_items_for_material_
 * requests`, re-exported at that path for backward compatibility), the same boundary
 * `callMethodWithResult` already wraps. Confirmed **pure calculation** — reads Bin/Item/BOM/
 * supplier data and returns a plain list of computed rows; no `frappe.db.set_value`/`.insert()`/
 * `.save()` anywhere in it or its helpers, so unlike the sub-assembly step there isn't even an
 * in-memory document mutation to discard — the Production Plan itself is untouched either way.
 *
 * Uses `draft.sub_assembly_items` as already fetched (whatever this Production Plan currently
 * has saved) rather than requiring the caller to pass sub-assembly rows through separately —
 * matching Desk's own two-step flow: run "Get Sub Assembly Items" and Save it first if raw
 * materials should explode through sub-assemblies too, then run this. A plan with no
 * sub-assemblies (the common single-level-BOM case) can skip that step entirely.
 *
 * Scope: single "For Warehouse" only ("Get Items for Purchase Only"), matching
 * `production_plan.js`'s `get_items_for_mr` trigger (`warehouses: [{ warehouse: for_warehouse }]`)
 * — the multi-location "Get Items for Purchase / Transfer" dialog (picking additional "transfer
 * from" warehouses) is intentionally deferred, see `production-plan.md`.
 */
export async function getMaterialRequirementsPreview(
  name: string,
  options: MaterialRequirementOptions,
): Promise<ProductionPlanMaterialRequestPlanItemRowInput[]> {
  if (!options.for_warehouse) {
    throw new Error("Select a For Warehouse first.");
  }
  const draft = await loadDraftOrThrow(name);
  const payload = { ...draft, ...options };
  const rows = await callAndHumanize(() =>
    callMethodWithResult<unknown[]>(
      "erpnext.manufacturing.doctype.production_plan.production_plan.get_items_for_material_requests",
      { doc: payload, warehouses: [{ warehouse: options.for_warehouse }] },
    ),
  );
  return parseProductionPlanMaterialRequestPlanItemRows(rows);
}

/** Persists a previewed `mr_items` result (plus the options that produced it). Same full-table
 * replace / re-check-fresh reasoning as `saveSubAssemblyItemsAction` above. */
export async function saveMaterialRequirementsAction(
  name: string,
  options: MaterialRequirementOptions,
  rows: ProductionPlanMaterialRequestPlanItemRowInput[],
): Promise<void> {
  await loadDraftOrThrow(name);
  await callAndHumanize(() => updateDoc("Production Plan", name, { ...options, mr_items: rows }));
  revalidatePath(`/manufacturing/production-plans/${encodeURIComponent(name)}`);
}
