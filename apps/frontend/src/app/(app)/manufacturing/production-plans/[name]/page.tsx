import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { DocActionBar } from "@/components/DocActionBar";
import { DocField } from "@/components/DocField";
import { DocTabs } from "@/components/DocTabs";
import { ProductionPlanMaterialRequirementPanel } from "@/components/ProductionPlanMaterialRequirementPanel";
import { ProductionPlanSubAssemblyPanel } from "@/components/ProductionPlanSubAssemblyPanel";
import { StatusPill } from "@/components/StatusPill";
import { ErpNextError, getDoc, listDocs } from "@/lib/erpnext";
import { productionPlanStatus } from "@/lib/erpStatus";
import { getStockDefaults } from "@/lib/stockDefaults";
import { submitProductionPlanAction } from "../actions";

/**
 * Field shapes below are read off `docs/backend/05-manufacturing/production-plan.md` (the
 * 2026-09-19 discovery/canonicalization pass) — schema-verified via live `get_doctype_fields`,
 * cross-checked against `frappe/erpnext` source, but never live-write-tested (no Production Plan
 * document exists on this instance yet; see MFG-UNV-012). Only fields that baseline actually
 * documents are used here — nothing invented.
 */
type ProductionPlanSalesOrderRow = {
  sales_order: string;
  sales_order_date?: string;
  customer?: string;
  grand_total?: number;
  status?: string;
};

type ProductionPlanMaterialRequestRow = {
  material_request: string;
  material_request_date?: string;
};

/** `po_items` — the finished-goods planning row. `name` is Frappe's own autonamed child-table
 * row id, shown as a traceability handle since `sub_assembly_items.production_plan_item` and
 * `Work Order.production_plan_item` both reference a `po_items` row by this same `name`. */
type ProductionPlanItemRow = {
  name: string;
  item_code: string;
  bom_no: string;
  planned_qty: number;
  stock_uom?: string;
  warehouse?: string;
  planned_start_date?: string;
  pending_qty?: number;
  ordered_qty?: number;
  produced_qty?: number;
  sales_order?: string;
  material_request?: string;
};

type ProductionPlanSubAssemblyItemRow = {
  name: string;
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
  purchase_order?: string;
  sales_order?: string;
  production_plan_item?: string;
  schedule_date?: string;
  uom?: string;
};

type MaterialRequestPlanItemRow = {
  name: string;
  item_code: string;
  warehouse: string;
  material_request_type?: string;
  quantity: number;
  requested_qty?: number;
  actual_qty?: number;
  safety_stock?: number;
  from_bom?: string;
  uom?: string;
};

type ProductionPlanItemReferenceRow = {
  item_reference: string;
  sales_order?: string;
  sales_order_item?: string;
  qty?: number;
};

type ProductionPlanDoc = {
  name: string;
  company: string;
  posting_date: string;
  status: string;
  docstatus: 0 | 1 | 2;
  get_items_from?: string;
  reserve_stock?: 0 | 1;
  combine_items?: 0 | 1;
  combine_sub_items?: 0 | 1;
  ignore_existing_ordered_qty?: 0 | 1;
  include_non_stock_items?: 0 | 1;
  include_subcontracted_items?: 0 | 1;
  consider_minimum_order_qty?: 0 | 1;
  include_safety_stock?: 0 | 1;
  skip_available_sub_assembly_item?: 0 | 1;
  sub_assembly_warehouse?: string;
  for_warehouse?: string;
  total_planned_qty?: number;
  total_produced_qty?: number;
  amended_from?: string;
  creation: string;
  modified: string;
  po_items?: ProductionPlanItemRow[];
  sales_orders?: ProductionPlanSalesOrderRow[];
  material_requests?: ProductionPlanMaterialRequestRow[];
  sub_assembly_items?: ProductionPlanSubAssemblyItemRow[];
  mr_items?: MaterialRequestPlanItemRow[];
  prod_plan_references?: ProductionPlanItemReferenceRow[];
};

/** Work Order rows generated from this Production Plan — traced via the explicit backend
 * back-references (`production_plan`/`production_plan_item`/`production_plan_sub_assembly_item`),
 * never inferred from Item/BOM matching, per PP-1's scope. */
type GeneratedWorkOrderRow = {
  name: string;
  status: string;
  production_item: string;
  item_name?: string;
  qty: number;
  produced_qty?: number;
  production_plan_item?: string;
  production_plan_sub_assembly_item?: string;
};

const cell = "px-3 py-2";
const plainTableWrap = "overflow-x-auto rounded-xl border border-border bg-surface";
const plainTableHead = "border-b border-border bg-canvas text-graphite-500";

/** Internal document link — same visual treatment as every other read-only entity page's local
 * `DocLink` helper (Work Order detail, BOM detail); kept per-file per that existing convention. */
function DocLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-mono text-signal hover:underline">
      {children}
    </Link>
  );
}

function yesNo(value: 0 | 1 | undefined): string {
  return value ? "Yes" : "No";
}

function docstatusLabel(docstatus: 0 | 1 | 2): string {
  return docstatus === 0 ? "Draft" : docstatus === 1 ? "Submitted" : "Cancelled";
}

export default async function ProductionPlanDetailPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;

  let doc: ProductionPlanDoc;
  try {
    doc = await getDoc<ProductionPlanDoc>("Production Plan", decodeURIComponent(name));
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  // Work Order traceability (section 11) — explicit backend back-reference, bounded query, same
  // shape as Work Order detail's own Job Card/Material Transfer fetches.
  const generatedWorkOrders = await listDocs<GeneratedWorkOrderRow>("Work Order", {
    fields: [
      "name",
      "status",
      "production_item",
      "item_name",
      "qty",
      "produced_qty",
      "production_plan_item",
      "production_plan_sub_assembly_item",
    ],
    filters: [["production_plan", "=", doc.name]],
    limit: 100,
    orderBy: "creation asc",
  });

  const isDraft = doc.docstatus === 0;
  const stockDefaults = isDraft ? await getStockDefaults(doc.company) : null;

  const status = productionPlanStatus(doc);
  const poItems = doc.po_items ?? [];
  const salesOrders = doc.sales_orders ?? [];
  const materialRequests = doc.material_requests ?? [];
  const subAssemblyItems = doc.sub_assembly_items ?? [];
  const mrItems = doc.mr_items ?? [];
  const prodPlanReferences = doc.prod_plan_references ?? [];

  const overviewTab = (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-sm font-semibold text-graphite-900">Production Plan</h2>
        <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <DocField label="Company" value={doc.company} />
          <DocField label="Posting Date" value={doc.posting_date} mono />
          {/* Status (server-calculated business status) and Docstatus (submittable
              draft/submitted/cancelled state) are kept as two distinct fields per PP-1 scope —
              Production Plan's own status enum already spells out Draft/Submitted/Cancelled as
              literal values, so the two can read the same in the common case without being the
              same underlying field. */}
          <DocField label="Docstatus" value={docstatusLabel(doc.docstatus)} />
          <DocField label="Get Items From" value={doc.get_items_from || "—"} />
          <DocField label="Total Planned Qty" value={String(doc.total_planned_qty ?? 0)} mono />
          <DocField label="Total Produced Qty" value={String(doc.total_produced_qty ?? 0)} mono />
          {doc.for_warehouse && (
            <DocField
              label="For Warehouse"
              value={<DocLink href={`/master-data/warehouses/${encodeURIComponent(doc.for_warehouse)}`}>{doc.for_warehouse}</DocLink>}
            />
          )}
          {doc.sub_assembly_warehouse && (
            <DocField
              label="Sub Assembly Warehouse"
              value={
                <DocLink href={`/master-data/warehouses/${encodeURIComponent(doc.sub_assembly_warehouse)}`}>
                  {doc.sub_assembly_warehouse}
                </DocLink>
              }
            />
          )}
          {doc.amended_from && (
            <DocField
              label="Amended From"
              value={
                <DocLink href={`/manufacturing/production-plans/${encodeURIComponent(doc.amended_from)}`}>
                  {doc.amended_from}
                </DocLink>
              }
            />
          )}
        </dl>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-graphite-900">Planning Controls</h2>
        <p className="mb-3 text-xs text-graphite-500">
          Read-only configuration as recorded on this document — these toggles drive ERPNext&apos;s own
          server-side planning/explosion/shortage logic and are not editable from this app.
        </p>
        <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <DocField label="Combine Items" value={yesNo(doc.combine_items)} />
          <DocField label="Combine Sub Items" value={yesNo(doc.combine_sub_items)} />
          <DocField label="Skip Available Sub Assembly Item" value={yesNo(doc.skip_available_sub_assembly_item)} />
          <DocField label="Ignore Existing Ordered Qty" value={yesNo(doc.ignore_existing_ordered_qty)} />
          <DocField label="Include Non Stock Items" value={yesNo(doc.include_non_stock_items)} />
          <DocField label="Include Subcontracted Items" value={yesNo(doc.include_subcontracted_items)} />
          <DocField label="Consider Minimum Order Qty" value={yesNo(doc.consider_minimum_order_qty)} />
          <DocField label="Include Safety Stock" value={yesNo(doc.include_safety_stock)} />
          <DocField label="Reserve Stock" value={yesNo(doc.reserve_stock)} />
        </dl>
      </div>

      <p className="text-xs text-graphite-500">
        A Draft Production Plan can be submitted from this page (see Submit above) through
        ERPNext&apos;s own native lifecycle. Get Sub Assembly Items (Sub-Assemblies tab) and Get
        Items for Purchase Only (Material Requirements tab) are available while this plan is a
        Draft — see those tabs. Get Sales Orders/Material Request, Get Finished Goods, Make Work
        Order, and Make Material Request remain unavailable here — including on a Submitted plan,
        where ERPNext itself would expose them — see this record&apos;s current backend-recorded
        state above.
      </p>
    </div>
  );

  const finishedGoodsTab = (
    <div className={plainTableWrap}>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className={plainTableHead}>
            <th className={`${cell} font-semibold`}>Item</th>
            <th className={`${cell} font-semibold`}>Warehouse</th>
            <th className={`${cell} text-right font-semibold`}>Planned Qty</th>
            <th className={`${cell} text-right font-semibold`}>Pending Qty</th>
            <th className={`${cell} text-right font-semibold`}>Produced Qty</th>
            <th className={`${cell} font-semibold`}>BOM</th>
            <th className={`${cell} font-semibold`}>Demand Source</th>
            <th className={`${cell} font-semibold`}>Planned Start</th>
            <th className={`${cell} font-semibold`}>Row</th>
          </tr>
        </thead>
        <tbody>
          {poItems.map((row) => (
            <tr key={row.name} className="border-b border-border last:border-0">
              <td className={cell}>
                <DocLink href={`/master-data/items/${encodeURIComponent(row.item_code)}`}>{row.item_code}</DocLink>
              </td>
              <td className={cell}>
                {row.warehouse ? (
                  <DocLink href={`/master-data/warehouses/${encodeURIComponent(row.warehouse)}`}>{row.warehouse}</DocLink>
                ) : (
                  "—"
                )}
              </td>
              <td className={`${cell} text-right font-mono tabular-nums`}>
                {row.planned_qty} {row.stock_uom || ""}
              </td>
              <td className={`${cell} text-right font-mono tabular-nums`}>{row.pending_qty ?? "—"}</td>
              <td className={`${cell} text-right font-mono tabular-nums`}>{row.produced_qty ?? 0}</td>
              <td className={cell}>
                <DocLink href={`/master-data/boms/${encodeURIComponent(row.bom_no)}`}>{row.bom_no}</DocLink>
              </td>
              <td className={cell}>
                {row.sales_order ? (
                  <DocLink href={`/sales/orders/${encodeURIComponent(row.sales_order)}`}>{row.sales_order}</DocLink>
                ) : row.material_request ? (
                  <DocLink href={`/buying/material-requests/${encodeURIComponent(row.material_request)}`}>
                    {row.material_request}
                  </DocLink>
                ) : (
                  "—"
                )}
              </td>
              <td className={`${cell} font-mono text-graphite-500`}>{row.planned_start_date || "—"}</td>
              <td className={`${cell} font-mono text-xs text-graphite-500`}>{row.name}</td>
            </tr>
          ))}
          {poItems.length === 0 && (
            <tr>
              <td colSpan={9} className="px-4 py-6 text-center text-graphite-500">
                No finished-goods rows on this Production Plan.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const demandSourcesTab = (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-graphite-900">Sales Orders</h2>
      <div className={`${plainTableWrap} mb-6`}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className={plainTableHead}>
              <th className={`${cell} font-semibold`}>Sales Order</th>
              <th className={`${cell} font-semibold`}>Date</th>
              <th className={`${cell} font-semibold`}>Customer</th>
              <th className={`${cell} text-right font-semibold`}>Grand Total</th>
              <th className={`${cell} font-semibold`}>Status</th>
            </tr>
          </thead>
          <tbody>
            {salesOrders.map((row, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className={cell}>
                  <DocLink href={`/sales/orders/${encodeURIComponent(row.sales_order)}`}>{row.sales_order}</DocLink>
                </td>
                <td className={`${cell} font-mono text-graphite-500`}>{row.sales_order_date || "—"}</td>
                <td className={cell}>{row.customer || "—"}</td>
                <td className={`${cell} text-right font-mono tabular-nums`}>{row.grand_total ?? "—"}</td>
                <td className={`${cell} text-graphite-500`}>{row.status || "—"}</td>
              </tr>
            ))}
            {salesOrders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-graphite-500">
                  No Sales Orders sourced into this Production Plan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mb-2 text-sm font-semibold text-graphite-900">Material Requests</h2>
      <div className={plainTableWrap}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className={plainTableHead}>
              <th className={`${cell} font-semibold`}>Material Request</th>
              <th className={`${cell} font-semibold`}>Date</th>
            </tr>
          </thead>
          <tbody>
            {materialRequests.map((row, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className={cell}>
                  <DocLink href={`/buying/material-requests/${encodeURIComponent(row.material_request)}`}>
                    {row.material_request}
                  </DocLink>
                </td>
                <td className={`${cell} font-mono text-graphite-500`}>{row.material_request_date || "—"}</td>
              </tr>
            ))}
            {materialRequests.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-6 text-center text-graphite-500">
                  No Material Requests sourced into this Production Plan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const subAssembliesTab = isDraft && stockDefaults ? (
    <ProductionPlanSubAssemblyPanel
      name={doc.name}
      warehouses={stockDefaults.warehouses}
      initialOptions={{
        sub_assembly_warehouse: doc.sub_assembly_warehouse,
        skip_available_sub_assembly_item: doc.skip_available_sub_assembly_item,
        combine_sub_items: doc.combine_sub_items,
      }}
      initialRows={subAssemblyItems}
    />
  ) : (
    <div>
      <p className="mb-3 text-xs text-graphite-500">
        Generated entirely by ERPNext&apos;s own server-side BOM explosion — not recomputed here.{" "}
        <code>bom_no</code> on each row records which BOM it exploded against; it is not an
        independent selector on this page.
      </p>
      <div className={plainTableWrap}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className={plainTableHead}>
              <th className={`${cell} font-semibold`}>Item</th>
              <th className={`${cell} font-semibold`}>Parent Item</th>
              <th className={`${cell} font-semibold`}>BOM</th>
              <th className={`${cell} font-semibold`}>Type of Manufacturing</th>
              <th className={`${cell} text-right font-semibold`}>Required Qty</th>
              <th className={`${cell} text-right font-semibold`}>Qty to Order</th>
              <th className={`${cell} font-semibold`}>Warehouse</th>
              <th className={`${cell} font-semibold`}>Schedule Date</th>
              <th className={`${cell} font-semibold`}>From Row</th>
            </tr>
          </thead>
          <tbody>
            {subAssemblyItems.map((row) => (
              <tr key={row.name} className="border-b border-border last:border-0">
                <td className={cell}>
                  <DocLink href={`/master-data/items/${encodeURIComponent(row.production_item)}`}>
                    {row.production_item}
                  </DocLink>
                </td>
                <td className={cell}>
                  {row.parent_item_code ? (
                    <DocLink href={`/master-data/items/${encodeURIComponent(row.parent_item_code)}`}>
                      {row.parent_item_code}
                    </DocLink>
                  ) : (
                    "—"
                  )}
                </td>
                <td className={cell}>
                  {row.bom_no ? (
                    <DocLink href={`/master-data/boms/${encodeURIComponent(row.bom_no)}`}>{row.bom_no}</DocLink>
                  ) : (
                    "—"
                  )}
                </td>
                <td className={`${cell} text-graphite-500`}>{row.type_of_manufacturing || "—"}</td>
                <td className={`${cell} text-right font-mono tabular-nums`}>
                  {row.required_qty ?? "—"} {row.uom || ""}
                </td>
                <td className={`${cell} text-right font-mono tabular-nums`}>{row.qty ?? "—"}</td>
                <td className={cell}>
                  {row.fg_warehouse ? (
                    <DocLink href={`/master-data/warehouses/${encodeURIComponent(row.fg_warehouse)}`}>
                      {row.fg_warehouse}
                    </DocLink>
                  ) : (
                    "—"
                  )}
                </td>
                <td className={`${cell} font-mono text-graphite-500`}>{row.schedule_date || "—"}</td>
                <td className={`${cell} font-mono text-xs text-graphite-500`}>{row.production_plan_item || "—"}</td>
              </tr>
            ))}
            {subAssemblyItems.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-graphite-500">
                  No sub-assembly rows on this Production Plan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const materialRequirementsTab = isDraft && stockDefaults ? (
    <ProductionPlanMaterialRequirementPanel
      name={doc.name}
      warehouses={stockDefaults.warehouses}
      initialOptions={{
        for_warehouse: doc.for_warehouse ?? "",
        ignore_existing_ordered_qty: doc.ignore_existing_ordered_qty,
        include_non_stock_items: doc.include_non_stock_items,
        consider_minimum_order_qty: doc.consider_minimum_order_qty,
        include_safety_stock: doc.include_safety_stock,
      }}
      initialRows={mrItems}
    />
  ) : (
    <div>
      <p className="mb-3 text-xs text-graphite-500">
        Required Qty is ERPNext&apos;s own computed shortage figure — not recalculated by this app.{" "}
        <code>From BOM</code> is read-only source-BOM traceability, not a BOM selector.
      </p>
      <div className={plainTableWrap}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className={plainTableHead}>
              <th className={`${cell} font-semibold`}>Item</th>
              <th className={`${cell} font-semibold`}>Warehouse</th>
              <th className={`${cell} text-right font-semibold`}>Required Qty</th>
              <th className={`${cell} text-right font-semibold`}>Available Qty</th>
              <th className={`${cell} text-right font-semibold`}>Safety Stock</th>
              <th className={`${cell} text-right font-semibold`}>Requested Qty</th>
              <th className={`${cell} font-semibold`}>Type</th>
              <th className={`${cell} font-semibold`}>From BOM</th>
            </tr>
          </thead>
          <tbody>
            {mrItems.map((row) => (
              <tr key={row.name} className="border-b border-border last:border-0">
                <td className={cell}>
                  <DocLink href={`/master-data/items/${encodeURIComponent(row.item_code)}`}>{row.item_code}</DocLink>
                </td>
                <td className={cell}>
                  <DocLink href={`/master-data/warehouses/${encodeURIComponent(row.warehouse)}`}>{row.warehouse}</DocLink>
                </td>
                <td className={`${cell} text-right font-mono tabular-nums`}>
                  {row.quantity} {row.uom || ""}
                </td>
                <td className={`${cell} text-right font-mono tabular-nums`}>{row.actual_qty ?? "—"}</td>
                <td className={`${cell} text-right font-mono tabular-nums`}>{row.safety_stock ?? "—"}</td>
                <td className={`${cell} text-right font-mono tabular-nums`}>{row.requested_qty ?? 0}</td>
                <td className={`${cell} text-graphite-500`}>{row.material_request_type || "—"}</td>
                <td className={cell}>
                  {row.from_bom ? (
                    <span className="inline-flex items-center gap-1">
                      <DocLink href={`/master-data/boms/${encodeURIComponent(row.from_bom)}`}>{row.from_bom}</DocLink>
                      <span className="rounded bg-graphite-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-graphite-500">
                        Trace
                      </span>
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
            {mrItems.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-graphite-500">
                  No material requirement rows on this Production Plan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const workOrdersTab = (
    <div className={plainTableWrap}>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className={plainTableHead}>
            <th className={`${cell} font-semibold`}>Work Order</th>
            <th className={`${cell} font-semibold`}>Status</th>
            <th className={`${cell} font-semibold`}>Item</th>
            <th className={`${cell} text-right font-semibold`}>Qty</th>
            <th className={`${cell} text-right font-semibold`}>Produced</th>
            <th className={`${cell} font-semibold`}>Source Row</th>
          </tr>
        </thead>
        <tbody>
          {generatedWorkOrders.map((wo) => (
            <tr key={wo.name} className="border-b border-border last:border-0">
              <td className={cell}>
                <DocLink href={`/manufacturing/work-orders/${encodeURIComponent(wo.name)}`}>{wo.name}</DocLink>
              </td>
              <td className={`${cell} text-graphite-500`}>{wo.status}</td>
              <td className={cell}>{wo.item_name || wo.production_item}</td>
              <td className={`${cell} text-right font-mono tabular-nums`}>{wo.qty}</td>
              <td className={`${cell} text-right font-mono tabular-nums`}>{wo.produced_qty ?? 0}</td>
              <td className={`${cell} font-mono text-xs text-graphite-500`}>
                {wo.production_plan_item || wo.production_plan_sub_assembly_item || "—"}
              </td>
            </tr>
          ))}
          {generatedWorkOrders.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-graphite-500">
                No Work Orders generated from this Production Plan yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const traceabilityTab = (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-graphite-900">Combine-Item References</h2>
      <p className="mb-3 text-xs text-graphite-500">
        Only populated when &quot;Combine Items&quot; merged multiple Sales Order rows into one
        Finished Goods row — traces a combined row back to its original Sales Orders.
      </p>
      <div className={`${plainTableWrap} mb-6`}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className={plainTableHead}>
              <th className={`${cell} font-semibold`}>Combined Row</th>
              <th className={`${cell} font-semibold`}>Sales Order</th>
              <th className={`${cell} font-semibold`}>Sales Order Item</th>
              <th className={`${cell} text-right font-semibold`}>Qty</th>
            </tr>
          </thead>
          <tbody>
            {prodPlanReferences.map((row, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className={`${cell} font-mono text-xs text-graphite-500`}>{row.item_reference}</td>
                <td className={cell}>
                  {row.sales_order ? (
                    <DocLink href={`/sales/orders/${encodeURIComponent(row.sales_order)}`}>{row.sales_order}</DocLink>
                  ) : (
                    "—"
                  )}
                </td>
                <td className={`${cell} font-mono text-xs text-graphite-500`}>{row.sales_order_item || "—"}</td>
                <td className={`${cell} text-right font-mono tabular-nums`}>{row.qty ?? "—"}</td>
              </tr>
            ))}
            {prodPlanReferences.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-graphite-500">
                  {doc.combine_items
                    ? "No combine-item references recorded on this Production Plan."
                    : "Combine Items is off for this Production Plan — no combined rows exist."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mb-2 text-sm font-semibold text-graphite-900">Material Request Traceability</h2>
      <div className="rounded-xl border border-border bg-surface p-4 text-sm text-graphite-500">
        Deferred in PP-1. Per the canonical model, a generated Material Request&apos;s link back to
        this Production Plan lives on <code>Material Request Item.production_plan</code> (the child
        row), not on the Material Request document itself — retrieving that relationship needs a
        join through Material Request Item that would expand this package&apos;s scope, so it is
        intentionally not shown here rather than approximated.
      </div>
    </div>
  );

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Manufacturing", href: "/manufacturing" },
          { label: "Production Plans", href: "/manufacturing/production-plans" },
          { label: doc.name },
        ]}
      />
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-graphite-900">{doc.name}</h1>
          <div className="mt-1">
            <StatusPill label={status.label} tone={status.tone} />
          </div>
        </div>
        {doc.docstatus === 0 && (
          <DocActionBar
            action={submitProductionPlanAction.bind(null, doc.name)}
            label="Submit"
            pendingLabel="Submitting…"
          />
        )}
      </div>
      <DocTabs
        tabs={[
          { id: "overview", label: "Overview", content: overviewTab },
          { id: "finished-goods", label: "Finished Goods", content: finishedGoodsTab },
          { id: "demand-sources", label: "Demand Sources", content: demandSourcesTab },
          { id: "sub-assemblies", label: "Sub-Assemblies", content: subAssembliesTab },
          { id: "material-requirements", label: "Material Requirements", content: materialRequirementsTab },
          { id: "work-orders", label: "Generated Work Orders", content: workOrdersTab },
          { id: "traceability", label: "Traceability", content: traceabilityTab },
        ]}
      />
    </div>
  );
}
