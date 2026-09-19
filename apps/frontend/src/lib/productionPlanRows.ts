import "server-only";

/** Same hidden-JSON-field technique as `lib/bomRows.ts`/`lib/lineRows.ts` — the client wizard
 * (`ProductionPlanCreateForm.tsx`) accumulates `sales_orders`/`material_requests`/`po_items`/
 * `prod_plan_references` state across several native-method round-trips (see
 * `lib/actions/productionPlanCreate.ts`), then serializes each into one hidden field per
 * table on final "Save as Draft" submit. Row shapes match `docs/backend/05-manufacturing/
 * production-plan.md`'s child-table field tables. */

export type ProductionPlanSalesOrderRowInput = {
  sales_order: string;
  sales_order_date?: string;
  customer?: string;
  grand_total?: number;
};

export type ProductionPlanMaterialRequestRowInput = {
  material_request: string;
  material_request_date?: string;
};

export type ProductionPlanItemRowInput = {
  item_code: string;
  bom_no: string;
  planned_qty: number;
  stock_uom?: string;
  warehouse?: string;
  planned_start_date?: string;
  description?: string;
  sales_order?: string;
  sales_order_item?: string;
  material_request?: string;
  material_request_item?: string;
};

export type ProductionPlanItemReferenceRowInput = {
  item_reference: string;
  sales_order?: string;
  sales_order_item?: string;
  qty?: number;
};

function parseJsonArray(formData: FormData, fieldName: string): Record<string, unknown>[] {
  const raw = String(formData.get(fieldName) ?? "[]");
  let rows: unknown;
  try {
    rows = JSON.parse(raw);
  } catch {
    return [];
  }
  return Array.isArray(rows) ? rows.filter((r): r is Record<string, unknown> => Boolean(r && typeof r === "object")) : [];
}

export function parseProductionPlanSalesOrderRows(formData: FormData, fieldName = "sales_orders"): ProductionPlanSalesOrderRowInput[] {
  return parseJsonArray(formData, fieldName)
    .filter((r) => r.sales_order)
    .map((r) => ({
      sales_order: String(r.sales_order),
      ...(typeof r.sales_order_date === "string" && r.sales_order_date ? { sales_order_date: r.sales_order_date } : {}),
      ...(typeof r.customer === "string" && r.customer ? { customer: r.customer } : {}),
      ...(Number(r.grand_total) > 0 ? { grand_total: Number(r.grand_total) } : {}),
    }));
}

export function parseProductionPlanMaterialRequestRows(
  formData: FormData,
  fieldName = "material_requests",
): ProductionPlanMaterialRequestRowInput[] {
  return parseJsonArray(formData, fieldName)
    .filter((r) => r.material_request)
    .map((r) => ({
      material_request: String(r.material_request),
      ...(typeof r.material_request_date === "string" && r.material_request_date
        ? { material_request_date: r.material_request_date }
        : {}),
    }));
}

export function parseProductionPlanItemRows(formData: FormData, fieldName = "po_items"): ProductionPlanItemRowInput[] {
  return parseJsonArray(formData, fieldName)
    .filter((r) => r.item_code && r.bom_no)
    .map((r) => ({
      item_code: String(r.item_code),
      bom_no: String(r.bom_no),
      planned_qty: Number(r.planned_qty) || 0,
      ...(typeof r.stock_uom === "string" && r.stock_uom ? { stock_uom: r.stock_uom } : {}),
      ...(typeof r.warehouse === "string" && r.warehouse ? { warehouse: r.warehouse } : {}),
      ...(typeof r.planned_start_date === "string" && r.planned_start_date
        ? { planned_start_date: r.planned_start_date }
        : {}),
      ...(typeof r.description === "string" && r.description ? { description: r.description } : {}),
      ...(typeof r.sales_order === "string" && r.sales_order ? { sales_order: r.sales_order } : {}),
      ...(typeof r.sales_order_item === "string" && r.sales_order_item ? { sales_order_item: r.sales_order_item } : {}),
      ...(typeof r.material_request === "string" && r.material_request ? { material_request: r.material_request } : {}),
      ...(typeof r.material_request_item === "string" && r.material_request_item
        ? { material_request_item: r.material_request_item }
        : {}),
    }))
    .filter((r) => r.planned_qty > 0);
}

export function parseProductionPlanReferenceRows(
  formData: FormData,
  fieldName = "prod_plan_references",
): ProductionPlanItemReferenceRowInput[] {
  return parseJsonArray(formData, fieldName)
    .filter((r) => r.item_reference)
    .map((r) => ({
      item_reference: String(r.item_reference),
      ...(typeof r.sales_order === "string" && r.sales_order ? { sales_order: r.sales_order } : {}),
      ...(typeof r.sales_order_item === "string" && r.sales_order_item ? { sales_order_item: r.sales_order_item } : {}),
      ...(Number(r.qty) > 0 ? { qty: Number(r.qty) } : {}),
    }));
}
