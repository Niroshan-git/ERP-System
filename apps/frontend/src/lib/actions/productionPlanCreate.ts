"use server";

import { callRunDocMethod, ErpNextError } from "@/lib/erpnext";

/**
 * `ErpNextError` (and its `erpnextMessage`/`status` fields) can't cross the Server
 * Function → Client Component boundary intact — only a plain `Error.message` survives.
 * Unwraps ERPNext's own human-readable message (e.g. "Please fill the Sales Orders table")
 * here, server-side, so the client only ever needs `e.message`.
 */
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

/**
 * In-progress (never-saved) Production Plan document shape passed back and forth with
 * ERPNext's own native server methods via `callRunDocMethod` — see that function's doc
 * comment in `lib/erpnext.ts`. Field names/types match `docs/backend/05-manufacturing/
 * production-plan.md`'s "Header — verified fields" and child-table tables exactly (schema
 * source: live `get_doctype_fields`, cross-checked against `frappe/erpnext` source,
 * 2026-09-19 discovery pass). Kept intentionally close to the real DocType shape — this is
 * sent to ERPNext as-is (roundtripped through `run_doc_method`), not a UI-only view model.
 */
export type ProductionPlanSalesOrderDraftRow = {
  sales_order: string;
  sales_order_date?: string;
  customer?: string;
  grand_total?: number;
};

export type ProductionPlanMaterialRequestDraftRow = {
  material_request: string;
  material_request_date?: string;
};

export type ProductionPlanItemDraftRow = {
  name?: string;
  item_code: string;
  item_name?: string;
  description?: string;
  bom_no: string;
  planned_qty: number;
  pending_qty?: number;
  stock_uom?: string;
  warehouse?: string;
  planned_start_date?: string;
  sales_order?: string;
  sales_order_item?: string;
  material_request?: string;
  material_request_item?: string;
};

export type ProductionPlanItemReferenceDraftRow = {
  item_reference: string;
  sales_order?: string;
  sales_order_item?: string;
  qty?: number;
};

export type ProductionPlanDraft = {
  company: string;
  posting_date: string;
  get_items_from: "Sales Order" | "Material Request" | "";
  item_code?: string;
  customer?: string;
  warehouse?: string;
  project?: string;
  sales_order_status?: string;
  from_date?: string;
  to_date?: string;
  from_delivery_date?: string;
  to_delivery_date?: string;
  combine_items?: 0 | 1;
  sales_orders: ProductionPlanSalesOrderDraftRow[];
  material_requests: ProductionPlanMaterialRequestDraftRow[];
  po_items: ProductionPlanItemDraftRow[];
  prod_plan_references: ProductionPlanItemReferenceDraftRow[];
};

/**
 * Strips undefined/empty-string filter fields before sending — ERPNext's own filter-building
 * code (`_apply_open_so_filters`, `production-plan.md`'s "Sales Order → Production Plan"
 * section) only applies a filter `if self.get(field)`, so omitting empty ones is equivalent to
 * sending them empty, but keeps the request payload honest about what's actually filtering.
 *
 * `name`/`__islocal`/`__unsaved` are **required**, not cosmetic — live-verified 2026-09-20
 * against the installed instance: `run_doc_method`'s `docs` branch calls
 * `frappe.get_doc(docs, check_permission=True)`, and without an explicit `name` this instance
 * resolves it as a **fetch-by-name** (`name` defaulting to Python `None`) and 404s with
 * `"Production Plan None not found"` — it does *not* fall back to constructing a fresh, unsaved
 * Document the way a bare `{doctype: ...}` dict might elsewhere. Setting a placeholder `name`
 * plus `__islocal: 1`/`__unsaved: 1` (the same flags Desk's own client-side new-doc state
 * carries) makes `is_new()`/`check_if_latest()` treat it correctly as new — confirmed live via
 * a full `get_open_sales_orders` → `combine_so_items` → real `createDoc` → delete round-trip
 * (created `MFG-PP-2026-00001`, Draft, correct `po_items`/`total_planned_qty`, then removed).
 */
function trimmedDraft(draft: ProductionPlanDraft): Record<string, unknown> {
  const { sales_orders, material_requests, po_items, prod_plan_references, ...header } = draft;
  const cleanHeader = Object.fromEntries(
    Object.entries(header).filter(([, v]) => v !== undefined && v !== ""),
  );
  return {
    doctype: "Production Plan",
    name: "new-production-plan-1",
    __islocal: 1,
    __unsaved: 1,
    ...cleanHeader,
    sales_orders,
    material_requests,
    po_items,
    prod_plan_references,
  };
}

/**
 * "Get Sales Orders" — native `get_open_sales_orders` (source: `services/sales_order_planning
 * .py`'s `SalesOrderSourcingService.get_open_sales_orders` → `get_sales_orders()` query +
 * `add_so_in_table()`). Eligibility (submitted, not Stopped/Closed, same company, qty not
 * already covered by a Work Order, filtered by whatever header/filter fields are set) and the
 * table replace-not-append behavior are both ERPNext's own — this function does not
 * reimplement any of it, only relays the mutated document back.
 */
export async function getOpenSalesOrders(draft: ProductionPlanDraft): Promise<ProductionPlanDraft> {
  return callAndHumanize(() => callRunDocMethod<ProductionPlanDraft>(trimmedDraft(draft), "get_open_sales_orders"));
}

/**
 * "Get Material Request" — native `get_pending_material_requests` (source: same service,
 * `_pending_mr_base_query`/`_apply_pending_mr_filters`): submitted `Manufacture`-type Material
 * Requests, not Stopped, same company, an active BOM for the item, qty not already ordered.
 */
export async function getPendingMaterialRequests(draft: ProductionPlanDraft): Promise<ProductionPlanDraft> {
  return callAndHumanize(() =>
    callRunDocMethod<ProductionPlanDraft>(trimmedDraft(draft), "get_pending_material_requests"),
  );
}

/**
 * "Get Finished Goods" — native `combine_so_items`, not `get_items` directly. Source
 * (`SalesOrderSourcingService.combine_so_items`): if `combine_items` is off, or `po_items` is
 * still empty, it just calls `get_items()`; if `combine_items` is on and rows already exist it
 * re-merges the existing `po_items` by `bom_no` instead. Calling this one native method (the
 * same one the real "Get Finished Goods" button invokes) covers both cases correctly without
 * this app needing to branch on `combine_items` itself. Requires `sales_orders`/
 * `material_requests` to already be populated (ERPNext throws "Please fill the Sales Orders
 * table" otherwise, per `get_so_items()`/`get_mr_items()` — surfaced to the caller as-is via
 * `ErpNextError`, not pre-validated here, so ERPNext's own message reaches the user).
 */
export async function getFinishedGoods(draft: ProductionPlanDraft): Promise<ProductionPlanDraft> {
  return callAndHumanize(() => callRunDocMethod<ProductionPlanDraft>(trimmedDraft(draft), "combine_so_items"));
}
