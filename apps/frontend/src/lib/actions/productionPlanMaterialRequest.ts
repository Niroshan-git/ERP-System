"use server";

import { revalidatePath } from "next/cache";
import { callRunDocMethod, ErpNextError, getDoc, listDocs } from "@/lib/erpnext";

/** Same unwrap as `productionPlanWorkOrder.ts`'s own `callAndHumanize` — `ErpNextError` can't
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

type MaterialRequestPlanItemRow = { name: string; quantity: number; requested_qty?: number };

type SubmittedSnapshot = Record<string, unknown> & {
  name: string;
  docstatus: 0 | 1 | 2;
  mr_items?: MaterialRequestPlanItemRow[];
};

/**
 * "Make Material Request" (PP-6) is native, Document-bound `make_material_request`
 * (`MaterialRequestService.make_material_request`, `erpnext/manufacturing/doctype/production_plan/
 * services/material_request.py`, confirmed 2026-09-20 against `frappe/erpnext`). Like
 * `make_work_order`, it carries **no server-side docstatus check of its own** — Desk only hides
 * the "Material Request" button once `docstatus === 1` (`production_plan.js` `refresh()`, same
 * `if (frm.doc.docstatus === 1)` block the Work Order button lives in). Backend stays
 * authoritative here: this app enforces `docstatus === 1` itself, same defense-in-depth precedent
 * as `productionPlanWorkOrder.ts`'s `loadSubmittedOrThrow`.
 *
 * Status ("Material Requested"/"Closed") is deliberately NOT blocked here, for the same reason
 * PP-5 didn't block "Completed"/"Closed" for Work Order: Desk only hides its own button for those
 * statuses, it adds no server-side check for them — blocking it here would make Ceylon Stack
 * stricter than ERPNext itself for no documented reason. That distinction is a UI-only visibility
 * rule in the page that renders `ProductionPlanMakeMaterialRequestAction`.
 *
 * **Security-critical difference from `make_work_order`**: `WorkOrderCreationService.make_work_order()`
 * opens with `self.doc.reload()`, discarding whatever payload was sent and re-fetching from the DB
 * — so the payload's own field values never actually reach ERPNext's quantity math there.
 * `MaterialRequestService.make_material_request()` has **no such reload** — it iterates
 * `self.doc.mr_items` exactly as received in the `run_doc_method` payload, and
 * `frappe.get_doc(docs, check_permission=True)` never touches the DB for a fetch (see
 * `lib/erpnext.ts`'s `callRunDocMethod` doc comment) — it builds the in-memory Document purely
 * from whatever dict this app sends. This means the qty math (`quantity − requested_qty` per row)
 * ERPNext runs is only as trustworthy as the payload's own `mr_items` values. This function is
 * therefore the entire trust boundary: it re-fetches the real, saved Production Plan via `getDoc`
 * and sends that untouched object straight through — no caller-supplied row/qty data is ever
 * accepted or merged in.
 */
async function loadSubmittedOrThrow(name: string): Promise<SubmittedSnapshot> {
  const doc = await getDoc<SubmittedSnapshot>("Production Plan", name);
  if (doc.docstatus !== 1) {
    throw new Error("Only a Submitted Production Plan can generate Material Requests here.");
  }
  return doc;
}

/**
 * Back-reference lives on the child row (`Material Request Item.production_plan`), not on the
 * Material Request parent doctype itself — see production-plan.md's "Material Request
 * generation" section. Same nested-filter shape `productionPlanWorkOrder.ts` already uses for
 * `Purchase Order Item.production_plan`.
 *
 * **Live-confirmed 2026-09-20 (PP-6 test run):** this nested `[Child Doctype, field, op, value]`
 * filter joins against the child table and returns one PARENT row per MATCHING CHILD row, not one
 * per distinct parent — a Material Request with 3 items all carrying `production_plan = <name>`
 * came back 3 times in the same list response. Must dedupe by `name` before use; a caller that
 * naively `.map()`s this into a result list (as an earlier draft of this action did) would report
 * the same generated Material Request 2-3× depending on how many of its lines trace back to this
 * plan.
 */
async function listMaterialRequestNames(name: string): Promise<string[]> {
  const rows = await listDocs<{ name: string }>("Material Request", {
    fields: ["name"],
    filters: [["Material Request Item", "production_plan", "=", name]],
    limit: 500,
  });
  return [...new Set(rows.map((r) => r.name))];
}

export type MakeMaterialRequestResult = {
  materialRequests: string[];
  submitted: boolean;
};

/**
 * Delegates entirely to ERPNext's own native Material Request generation — see
 * `docs/backend/05-manufacturing/production-plan.md`'s "Material Request generation" section for
 * the grouping key (`sales_order` + `material_request_type`) and requested-vs-required tracking
 * this app never reimplements or second-guesses client-side.
 *
 * `submitMaterialRequest` mirrors Desk's own `frappe.confirm("Do you want to submit the material
 * request")` dialog exactly — `production_plan.js`'s `create_material_request(frm, submit)` sets
 * `frm.doc.submit_material_request = submit` (a transient, non-schema field read only via
 * `self.doc.get("submit_material_request")` for the duration of this one request — never
 * persisted; see production-plan.md's noted schema drift) before calling `make_material_request`.
 * This app reproduces the same choice, not a new capability.
 *
 * `make_material_request()` returns nothing usable (only `frappe.msgprint()`s an HTML link list),
 * so — same precedent as `makeWorkOrderAction` — the actual created documents are found by diffing
 * `Material Request` back-reference queries taken immediately before and after the call, not a
 * fabricated name guess.
 */
export async function makeMaterialRequestAction(
  name: string,
  submitMaterialRequest: boolean,
): Promise<MakeMaterialRequestResult> {
  const doc = await loadSubmittedOrThrow(name);

  if (!doc.mr_items || doc.mr_items.length === 0) {
    throw new Error(
      "This Production Plan has no material requirement rows yet — run Get Items for Purchase Only on the Material Requirements tab first.",
    );
  }

  const before = new Set(await listMaterialRequestNames(name));

  await callAndHumanize(() =>
    callRunDocMethod<Record<string, unknown>>(
      { ...doc, submit_material_request: submitMaterialRequest ? 1 : 0 },
      "make_material_request",
    ),
  );

  const after = await listMaterialRequestNames(name);
  const materialRequests = after.filter((n) => !before.has(n));

  revalidatePath(`/manufacturing/production-plans/${encodeURIComponent(name)}`);
  return { materialRequests, submitted: submitMaterialRequest };
}
