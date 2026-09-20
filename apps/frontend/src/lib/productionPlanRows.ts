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

/** `Production Plan Sub Assembly Item` (`sub_assembly_items`) — ERPNext-derived BOM-explosion
 * rows (PP-4). Whitelisted to the fields `production-plan.md`'s schema baseline actually
 * documents; drops calculation-only keys the native `get_sub_assembly_items` response also
 * carries (`item_name`, `description`, `is_sub_contracted_item`, `indent`, `main_bom`,
 * `stock_qty`) that aren't confirmed fields on this child doctype. */
export type ProductionPlanSubAssemblyItemRowInput = {
  production_item: string;
  parent_item_code?: string;
  bom_no?: string;
  bom_level?: number;
  type_of_manufacturing?: string;
  required_qty?: number;
  projected_qty?: number;
  qty?: number;
  fg_warehouse?: string;
  supplier?: string;
  sales_order?: string;
  sales_order_item?: string;
  production_plan_item?: string;
  schedule_date?: string;
  uom?: string;
  stock_uom?: string;
  actual_qty?: number;
};

export function parseProductionPlanSubAssemblyItemRows(rows: unknown): ProductionPlanSubAssemblyItemRowInput[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((r): r is Record<string, unknown> => Boolean(r && typeof r === "object"))
    .filter((r) => typeof r.production_item === "string" && r.production_item)
    .map((r) => ({
      production_item: String(r.production_item),
      ...(typeof r.parent_item_code === "string" && r.parent_item_code ? { parent_item_code: r.parent_item_code } : {}),
      ...(typeof r.bom_no === "string" && r.bom_no ? { bom_no: r.bom_no } : {}),
      ...(Number.isFinite(Number(r.bom_level)) ? { bom_level: Number(r.bom_level) } : {}),
      ...(typeof r.type_of_manufacturing === "string" && r.type_of_manufacturing
        ? { type_of_manufacturing: r.type_of_manufacturing }
        : {}),
      ...(Number.isFinite(Number(r.required_qty)) ? { required_qty: Number(r.required_qty) } : {}),
      ...(Number.isFinite(Number(r.projected_qty)) ? { projected_qty: Number(r.projected_qty) } : {}),
      ...(Number.isFinite(Number(r.qty)) ? { qty: Number(r.qty) } : {}),
      ...(typeof r.fg_warehouse === "string" && r.fg_warehouse ? { fg_warehouse: r.fg_warehouse } : {}),
      ...(typeof r.supplier === "string" && r.supplier ? { supplier: r.supplier } : {}),
      ...(typeof r.sales_order === "string" && r.sales_order ? { sales_order: r.sales_order } : {}),
      ...(typeof r.sales_order_item === "string" && r.sales_order_item ? { sales_order_item: r.sales_order_item } : {}),
      ...(typeof r.production_plan_item === "string" && r.production_plan_item
        ? { production_plan_item: r.production_plan_item }
        : {}),
      ...(typeof r.schedule_date === "string" && r.schedule_date ? { schedule_date: r.schedule_date } : {}),
      ...(typeof r.uom === "string" && r.uom ? { uom: r.uom } : {}),
      ...(typeof r.stock_uom === "string" && r.stock_uom ? { stock_uom: r.stock_uom } : {}),
      ...(Number.isFinite(Number(r.actual_qty)) ? { actual_qty: Number(r.actual_qty) } : {}),
    }));
}

/** `Material Request Plan Item` (`mr_items`) — ERPNext-derived raw-material shortage rows
 * (PP-4). Whitelisted the same way as above; drops `item_name`/`description` (not confirmed
 * schema fields on this child doctype per `production-plan.md`). `from_bom` is read-only
 * traceability, never a user-set selector — carried through as data only. */
export type ProductionPlanMaterialRequestPlanItemRowInput = {
  item_code: string;
  warehouse?: string;
  from_warehouse?: string;
  material_request_type?: string;
  quantity: number;
  actual_qty?: number;
  projected_qty?: number;
  ordered_qty?: number;
  reserved_qty_for_production?: number;
  safety_stock?: number;
  min_order_qty?: number;
  from_bom?: string;
  main_item_code?: string;
  required_bom_qty?: number;
  sales_order?: string;
  uom?: string;
  stock_uom?: string;
  conversion_factor?: number;
};

export function parseProductionPlanMaterialRequestPlanItemRows(
  rows: unknown,
): ProductionPlanMaterialRequestPlanItemRowInput[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((r): r is Record<string, unknown> => Boolean(r && typeof r === "object"))
    .filter((r) => typeof r.item_code === "string" && r.item_code)
    .map((r) => ({
      item_code: String(r.item_code),
      ...(typeof r.warehouse === "string" && r.warehouse ? { warehouse: r.warehouse } : {}),
      ...(typeof r.from_warehouse === "string" && r.from_warehouse ? { from_warehouse: r.from_warehouse } : {}),
      ...(typeof r.material_request_type === "string" && r.material_request_type
        ? { material_request_type: r.material_request_type }
        : {}),
      quantity: Number(r.quantity) || 0,
      ...(Number.isFinite(Number(r.actual_qty)) ? { actual_qty: Number(r.actual_qty) } : {}),
      ...(Number.isFinite(Number(r.projected_qty)) ? { projected_qty: Number(r.projected_qty) } : {}),
      ...(Number.isFinite(Number(r.ordered_qty)) ? { ordered_qty: Number(r.ordered_qty) } : {}),
      ...(Number.isFinite(Number(r.reserved_qty_for_production))
        ? { reserved_qty_for_production: Number(r.reserved_qty_for_production) }
        : {}),
      ...(Number.isFinite(Number(r.safety_stock)) ? { safety_stock: Number(r.safety_stock) } : {}),
      ...(Number.isFinite(Number(r.min_order_qty)) ? { min_order_qty: Number(r.min_order_qty) } : {}),
      ...(typeof r.from_bom === "string" && r.from_bom ? { from_bom: r.from_bom } : {}),
      ...(typeof r.main_item_code === "string" && r.main_item_code ? { main_item_code: r.main_item_code } : {}),
      ...(Number.isFinite(Number(r.required_bom_qty)) ? { required_bom_qty: Number(r.required_bom_qty) } : {}),
      ...(typeof r.sales_order === "string" && r.sales_order ? { sales_order: r.sales_order } : {}),
      ...(typeof r.uom === "string" && r.uom ? { uom: r.uom } : {}),
      ...(typeof r.stock_uom === "string" && r.stock_uom ? { stock_uom: r.stock_uom } : {}),
      ...(Number.isFinite(Number(r.conversion_factor)) ? { conversion_factor: Number(r.conversion_factor) } : {}),
    }));
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
