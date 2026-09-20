"use server";

import { revalidatePath } from "next/cache";
import { callRunDocMethod, ErpNextError, getDoc, listDocs } from "@/lib/erpnext";

/** Same unwrap as `productionPlanPlanning.ts`'s own `callAndHumanize` — `ErpNextError` can't
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

type SubmittedSnapshot = Record<string, unknown> & { name: string; docstatus: 0 | 1 | 2 };

/**
 * "Make Work Order" (PP-5) is native, Document-bound `make_work_order`
 * (`WorkOrderCreationService.make_work_order`, `erpnext/manufacturing/doctype/production_plan/
 * services/work_order_planning.py`, confirmed 2026-09-20 against `frappe/erpnext`). It carries
 * **no server-side docstatus check of its own** — ERPNext's own Desk only hides the "Work Order /
 * Subcontract PO" button once `docstatus === 1` (`production_plan.js` `refresh()`), the same
 * Desk-UI-only convention already documented for `get_sub_assembly_items`/`make_material_request`
 * in `production-plan.md`'s "Button/action visibility by docstatus" table. Backend stays
 * authoritative: this app enforces `docstatus === 1` itself, mirroring `loadDraftOrThrow`'s
 * precedent for the Draft-only actions (`productionPlanPlanning.ts`), just inverted — never trust
 * the page that rendered the button, re-fetch and re-check first.
 *
 * Status ("Completed"/"Closed") is deliberately NOT blocked here — Desk only hides its own button
 * for those two statuses, it adds no server-side check for them either (same source read), so
 * blocking it in this server action would make Ceylon Stack stricter than ERPNext itself for no
 * documented reason. That distinction is surfaced as a UI-only visibility rule instead, in the
 * page that renders `ProductionPlanMakeWorkOrderAction`.
 */
async function loadSubmittedOrThrow(name: string): Promise<SubmittedSnapshot> {
  const doc = await getDoc<SubmittedSnapshot>("Production Plan", name);
  if (doc.docstatus !== 1) {
    throw new Error("Only a Submitted Production Plan can generate Work Orders here.");
  }
  return doc;
}

async function listWorkOrderNames(name: string): Promise<string[]> {
  const rows = await listDocs<{ name: string }>("Work Order", {
    fields: ["name"],
    filters: [["production_plan", "=", name]],
    limit: 500,
  });
  return rows.map((r) => r.name);
}

/**
 * Purchase Order side effect ("subcontract Purchase Order") is inherent to the ONE native
 * `make_work_order` call this action delegates to — `WorkOrderCreationService.make_work_order`
 * also consolidates any Subcontract-type sub-assembly rows into Purchase Orders in the same call
 * (`make_subcontracted_purchase_order`, same source file). Ceylon Stack does not build a separate
 * "subcontract Purchase Order" feature (out of scope per the PP-5 package brief) — this best-effort
 * check only reports whether the single native call happened to also create one, so the result
 * notice stays honest rather than silently hiding a real side effect.
 *
 * `Purchase Order Item.production_plan` (Link → Production Plan) is live-schema-confirmed to exist
 * (2026-09-20, `get_doctype_fields` against the real Hetzner instance) — the back-reference lives
 * on the child row, same shape as `Material Request Item.production_plan`; the parent `Purchase
 * Order` doctype itself carries no such field. Best-effort: if this nested child-table filter shape
 * isn't supported by this REST boundary, degrade to `null` ("unknown") rather than failing the
 * whole action — this is a peripheral notice, not the action's core result, and no sub-assembly/
 * subcontract test data exists on this instance to have exercised this path live (see
 * production-plan.md's PP-5 section — SOURCE VERIFIED / NOT RUNTIME VERIFIED).
 *
 * **PP-5R (2026-09-20):** same nested `[Child Doctype, field, op, value]` shape as
 * `listMaterialRequestNames` in `productionPlanMaterialRequest.ts` (PP-6), which was live-confirmed
 * to return one PARENT row per MATCHING CHILD row, not one per distinct parent — a Purchase Order
 * with multiple items all carrying `production_plan = <name>` would come back once per matching
 * item. Deduping here mirrors that already-accepted fix, so a single subcontracting Purchase Order
 * with several matching lines is reported once instead of once per line. Not separately
 * runtime-verified against live subcontract PO data (see caveat above) — inherited from the
 * PP-6 precedent, not a fresh live observation.
 */
async function listSubcontractPurchaseOrderNames(name: string): Promise<string[] | null> {
  try {
    const rows = await listDocs<{ name: string }>("Purchase Order", {
      fields: ["name"],
      filters: [["Purchase Order Item", "production_plan", "=", name]],
      limit: 500,
    });
    return [...new Set(rows.map((r) => r.name))];
  } catch {
    return null;
  }
}

export type MakeWorkOrderResult = {
  workOrders: string[];
  purchaseOrders: string[] | null;
};

/**
 * Delegates entirely to ERPNext's own native Work Order / subcontract-PO generation — see
 * `docs/backend/05-manufacturing/production-plan.md`'s "Work Order generation" section for the
 * quantity semantics (`ProductionPlanWorkOrderQuantities.get_pending_quantities`, a plain
 * non-locking read against submitted Work Orders only), which this app never reimplements or
 * second-guesses client-side.
 *
 * `make_work_order()` returns nothing usable (it only `frappe.msgprint()`s an HTML link list —
 * message-log content this app's `erpnextFetch` doesn't surface on a successful response) and its
 * own first line is `self.doc.reload()`, so whatever payload is sent gets replaced by the real
 * saved DB state before anything else runs — a plain re-fetched doc is sufficient, no special
 * unsaved-doc placeholder handling needed here (contrast `productionPlanCreate.ts`).
 *
 * Because there is no reliable return payload naming what was created, the actual created
 * documents are found by diffing the real `Work Order`/`Purchase Order` back-reference queries
 * (`production_plan` / `Purchase Order Item.production_plan`) taken immediately before and after
 * the call — an honest post-hoc observation of what ERPNext actually persisted, not a fabricated
 * name guess from a naming-series assumption. Standard Frappe request-transaction semantics apply
 * to the native call itself (SOURCE VERIFIED, not separately proven this session): no explicit
 * per-item `frappe.db.commit()` exists in `work_order_planning.py`'s loop, so an uncaught exception
 * partway through rolls back the entire request — the one per-item exception the source explicitly
 * swallows is `OverProductionError` (`create_work_order()`'s own `except` clause), which skips just
 * that row and continues. This diff-based approach reports whatever actually landed either way.
 */
export async function makeWorkOrderAction(name: string): Promise<MakeWorkOrderResult> {
  const draft = await loadSubmittedOrThrow(name);

  const [before, beforePO] = await Promise.all([
    listWorkOrderNames(name),
    listSubcontractPurchaseOrderNames(name),
  ]);
  const beforeSet = new Set(before);
  const beforePOSet = new Set(beforePO ?? []);

  await callAndHumanize(() => callRunDocMethod<Record<string, unknown>>(draft, "make_work_order"));

  const [after, afterPO] = await Promise.all([
    listWorkOrderNames(name),
    listSubcontractPurchaseOrderNames(name),
  ]);

  const workOrders = after.filter((n) => !beforeSet.has(n));
  const purchaseOrders = afterPO === null ? null : afterPO.filter((n) => !beforePOSet.has(n));

  revalidatePath(`/manufacturing/production-plans/${encodeURIComponent(name)}`);
  return { workOrders, purchaseOrders };
}
