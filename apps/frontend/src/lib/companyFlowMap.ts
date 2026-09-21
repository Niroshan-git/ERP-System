import { Building2, ClipboardList, Cog, Factory, PackageCheck, ReceiptText, ShoppingCart, Truck, Users, Wallet } from "lucide-react";
import type { FlowRecord, FlowScene } from "@/lib/flowMap";

/**
 * Company-wide flow map — the bird's-eye view stitching Buying, Inventory, Manufacturing and
 * Sales together, for the root "/" module picker. Rendered by the same shared, generic
 * `FlowMap`/`FlowNodeDialog` components as every per-module flow (`lib/flowMap.ts`'s doc
 * comment) — this is a fifth *data* module, not a sixth component.
 *
 * Two scenes, mirroring the classic supply-chain split into Procure-to-Pay and
 * Order-to-Cash rather than one undifferentiated diagram:
 * - **"Procure to cash"**: the fullest chain, supply-side through to billing (Supplier ->
 *   ... -> Sales Invoice). Kept its original name/id even though it now has a sibling scene,
 *   to avoid re-touching already-reviewed content for a rename alone.
 * - **"Sale to cash"**: the customer-facing half on its own (Customer -> Sales Order ->
 *   Delivery -> Invoice -> Payment), for when the ask is specifically the sales side rather
 *   than the full supply chain. Reuses the `salesOrder`/`delivery`/`invoice` node *records*
 *   already defined for the first scene (same key, same detail panel) in a shorter node
 *   list, the same way `manufacturingFlowMap.ts`'s "planned"/"direct" scenes both reuse `bom`/
 *   `workOrder`.
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
  | "customer"
  | "salesOrder"
  | "delivery"
  | "invoice"
  | "payment";

export type CompanyFlowSceneId = "procureToCash" | "saleToCash";

export const COMPANY_FLOW_SCENE_ORDER: CompanyFlowSceneId[] = ["procureToCash", "saleToCash"];

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
  customer: {
    key: "customer",
    title: "Customer",
    subtitle: "Where selling starts",
    icon: Users,
    kind: "Master data",
    area: "Sales",
    href: "/master-data/customers",
    purpose: "The buyer every sales document in this chain is raised against.",
    effects: ["No stock movement or accounting posting from maintaining a customer record."],
    note: "Full sales-cycle detail (Quotation, Pick & Pack, advances, returns) is in Sales' own Sales Flow tab — this map skips straight to the Sales Order below to keep the company-wide view readable.",
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
    purpose: "Close the loop: bill the customer for what was delivered, whether it was sourced and produced first or resold as-is.",
    effects: ["Posts customer receivable, revenue and tax accounts."],
    note: "See /sales's Sales Flow tab for Customer Payment (not yet built) and the advance-payment/reserve-invoice variants.",
  },
  payment: {
    key: "payment",
    title: "Customer Payment",
    subtitle: "Cash in the door",
    icon: Wallet,
    kind: "Banking document",
    area: "Finance",
    href: null,
    purpose: "Record the customer's payment and allocate it to the invoice — the actual cash-in-hand event this chain has been building toward.",
    effects: ["Reduces the allocated customer balance.", "Does not recognise revenue a second time."],
    note: "Not yet built in this app — same Customer Payment gap /sales's own Sales Flow tab already documents.",
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
    shortcuts: [{ area: "Customer-facing half", label: "Sale to cash", scene: "saleToCash" }],
    note: "A Sales Order can be raised at any point in this chain, not only after production finishes — and purchased goods can be resold directly without a Work Order at all. This map shows the fullest version of the chain, not the only one.",
  },
  saleToCash: {
    id: "saleToCash",
    name: "Sale to cash",
    title: "How a sale turns into cash",
    hint: "The customer-facing half of the full cycle on its own, ending at the actual cash-in-hand event. Every stage links to its real page.",
    height: 610,
    lanes: [
      { label: "01  SELL & FULFIL", x: 34, y: 40 },
      { label: "02  COLLECT", x: 34, y: 280 },
    ],
    nodes: [
      { key: "customer", x: 42, y: 74, order: "01" },
      { key: "salesOrder", x: 342, y: 74, order: "02" },
      { key: "delivery", x: 642, y: 74, order: "03" },
      { key: "invoice", x: 942, y: 74, order: "04" },
      { key: "payment", x: 942, y: 314, order: "05" },
    ],
    edges: [
      { from: "customer", to: "salesOrder", path: "M260 140 H330" },
      { from: "salesOrder", to: "delivery", path: "M560 140 H630" },
      { from: "delivery", to: "invoice", path: "M860 140 H930" },
      { from: "invoice", to: "payment", path: "M1051 206 V302", label: "Bill & collect", lx: 1051, ly: 260 },
    ],
    shortcuts: [{ area: "Supply-side half", label: "Procure to cash", scene: "procureToCash" }],
    note: "A sale doesn't need anything from the Procure to cash scene to have happened first — see that scene for how purchasing/production feeds this chain's stock.",
  },
};
