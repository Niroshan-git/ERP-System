import { Building2, ClipboardList, Cog, Factory, PackageCheck, ReceiptText, ShoppingCart, Truck } from "lucide-react";
import type { FlowRecord, FlowScene } from "@/lib/flowMap";

/**
 * Company-wide "procure to cash" map — the bird's-eye view stitching Buying, Inventory,
 * Manufacturing and Sales into a single pass, for the root "/" module picker. Rendered by
 * the same shared, generic `FlowMap`/`FlowNodeDialog` components as every per-module flow
 * (`lib/flowMap.ts`'s doc comment) — this is a fifth *data* module, not a sixth component.
 *
 * Deliberately NOT a re-detailing of all four per-module flows (that would just be
 * `buyingFlowMap.ts` + `stockFlowMap.ts` + `manufacturingFlowMap.ts` + `salesFlowMap.ts`
 * concatenated, unreadable at this zoom level). Each node here is one real stage from an
 * existing per-module flow, summarized at "why this stage matters in the full chain" level;
 * every node's `note` field points at the module Flow tab that has the full stage-by-stage
 * detail, business rules and live-confirmed effects. Node/edge coordinates reuse the same
 * proven 2x4-grid template `salesFlowMap.ts`'s "standard" scene established (only labels/
 * keys changed) — the same precedent `manufacturingFlowMap.ts`/`buyingFlowMap.ts` already
 * followed, rather than inventing new SVG geometry from scratch.
 */

export type CompanyFlowNodeKey =
  | "supplier"
  | "purchaseOrder"
  | "purchaseReceipt"
  | "workOrder"
  | "manufacture"
  | "salesOrder"
  | "delivery"
  | "invoice";

export type CompanyFlowSceneId = "procureToCash";

export const COMPANY_FLOW_SCENE_ORDER: CompanyFlowSceneId[] = ["procureToCash"];

export const COMPANY_FLOW_RECORDS: Record<CompanyFlowNodeKey, FlowRecord<CompanyFlowNodeKey>> = {
  supplier: {
    key: "supplier",
    title: "Supplier",
    subtitle: "Where sourcing starts",
    icon: Building2,
    kind: "Master data",
    area: "Buying",
    href: "/master-data/suppliers",
    purpose: "The vendor every purchasing document in the chain below is raised against.",
    effects: ["No stock movement or accounting posting from maintaining a supplier record."],
    note: "Full sourcing detail (Material Request, RFQ, Supplier Quotation) is in Buying's own Buying Flow tab — this map skips straight to the Purchase Order below to keep the company-wide view readable.",
  },
  purchaseOrder: {
    key: "purchaseOrder",
    title: "Purchase Order",
    subtitle: "Commit to buy",
    icon: ShoppingCart,
    kind: "Purchase document",
    area: "Buying",
    href: "/buying/purchase-orders",
    purpose: "Confirm quantities, price and delivery terms with the supplier.",
    effects: ["No stock movement while Draft.", "No accounting posting from a standard Purchase Order."],
    note: "See /buying's Buying Flow tab for the full sourcing chain and the invoice-without-a-receipt shortcut.",
  },
  purchaseReceipt: {
    key: "purchaseReceipt",
    title: "Purchase Receipt",
    subtitle: "Stock enters the business",
    icon: PackageCheck,
    kind: "Stock document",
    area: "Inventory",
    href: "/buying/purchase-receipts",
    purpose: "The moment purchased goods physically arrive and become available raw material or resale stock.",
    effects: ["Increases stock in the target warehouse (Bin.actual_qty) — live-confirmed 2026-09-16."],
    note: "See /stock's Inventory Flow tab for how Warehouse, Batch/Serial No and the other Stock Entry purposes fit in alongside this.",
  },
  workOrder: {
    key: "workOrder",
    title: "Work Order",
    subtitle: "Turn stock into product",
    icon: Factory,
    kind: "Production document",
    area: "Manufacturing",
    href: "/manufacturing/work-orders",
    purpose: "Authorize production against a BOM, consuming the raw material this chain just received.",
    effects: ["No stock movement while Draft.", "Submit is what unlocks Material Transfer of the required raw materials."],
    note: "See /manufacturing's Manufacturing Flow tab for the Production Plan-driven route, the direct route, and Job Card detail.",
  },
  manufacture: {
    key: "manufacture",
    title: "Manufacture",
    subtitle: "Consume & receive stock",
    icon: Cog,
    kind: "Stock Entry (Manufacture)",
    area: "Inventory",
    href: null,
    purpose: "Consume the transferred raw materials and receive the finished goods into stock — the real production event.",
    effects: ["Writes the Work Order's consumed_qty/produced_qty.", "The point finished goods become available to sell."],
    note: "Not yet built in this app's frontend (no Manufacture-purpose Stock Entry UI) — same gap the Manufacturing Flow tab already documents.",
  },
  salesOrder: {
    key: "salesOrder",
    title: "Sales Order",
    subtitle: "Confirm customer demand",
    icon: ClipboardList,
    kind: "Sales document",
    area: "Sales",
    href: "/sales/orders",
    purpose: "Record what the customer is buying — can be raised any time, independent of where production/stock currently stands.",
    effects: ["No stock is deducted yet.", "No accounting journal from a standard Sales Order."],
    note: "See /sales's Sales Flow tab for the full cycle, including Pick & Pack, advances, and returns.",
  },
  delivery: {
    key: "delivery",
    title: "Delivery Note",
    subtitle: "Stock leaves the business",
    icon: Truck,
    kind: "Inventory document",
    area: "Inventory",
    href: "/sales/delivery-notes",
    purpose: "Dispatch the finished goods this chain produced (or purchased goods resold as-is) to the customer.",
    effects: ["Reduces stock on hand for stock items.", "Records the stock value movement out of the business."],
    note: "See /sales's Sales Flow tab for Pick & Pack and partial-delivery detail.",
  },
  invoice: {
    key: "invoice",
    title: "Sales Invoice",
    subtitle: "Bill & collect",
    icon: ReceiptText,
    kind: "Accounting document",
    area: "Finance",
    href: "/sales/invoices",
    purpose: "Close the loop: bill the customer for what was sourced, produced, and delivered.",
    effects: ["Posts customer receivable, revenue and tax accounts."],
    note: "See /sales's Sales Flow tab for Customer Payment (not yet built) and the advance-payment/reserve-invoice variants.",
  },
};

export const COMPANY_FLOW_SCENES: Record<CompanyFlowSceneId, FlowScene<CompanyFlowNodeKey, CompanyFlowSceneId>> = {
  procureToCash: {
    id: "procureToCash",
    name: "Procure to cash",
    title: "How Buying, Inventory, Manufacturing and Sales connect",
    hint: "One high-level pass through the full cycle. Every stage links to its real page, and its note points to the module Flow tab with full stage-by-stage detail and live-confirmed effects.",
    height: 610,
    lanes: [
      { label: "01  BUY & RECEIVE", x: 34, y: 40 },
      { label: "02  PRODUCE & SELL", x: 34, y: 280 },
    ],
    nodes: [
      { key: "supplier", x: 42, y: 74, order: "01" },
      { key: "purchaseOrder", x: 342, y: 74, order: "02" },
      { key: "purchaseReceipt", x: 642, y: 74, order: "03" },
      { key: "workOrder", x: 942, y: 74, order: "04" },
      { key: "manufacture", x: 942, y: 314, order: "05" },
      { key: "salesOrder", x: 642, y: 314, order: "06" },
      { key: "delivery", x: 342, y: 314, order: "07" },
      { key: "invoice", x: 42, y: 314, order: "08" },
    ],
    edges: [
      { from: "supplier", to: "purchaseOrder", path: "M260 140 H330" },
      { from: "purchaseOrder", to: "purchaseReceipt", path: "M560 140 H630" },
      { from: "purchaseReceipt", to: "workOrder", path: "M860 140 H930" },
      { from: "workOrder", to: "manufacture", path: "M1051 206 V302", label: "Transfer & produce", lx: 1051, ly: 260 },
      { from: "manufacture", to: "salesOrder", path: "M942 380 H872" },
      { from: "salesOrder", to: "delivery", path: "M642 380 H572" },
      { from: "delivery", to: "invoice", path: "M342 380 H272" },
    ],
    shortcuts: [],
    note: "A Sales Order can be raised at any point in this chain, not only after production finishes — and purchased goods can be resold directly without a Work Order at all. This map shows the fullest version of the chain, not the only one.",
  },
};
