import { Building2, ClipboardList, FilePenLine, FileSpreadsheet, PackageCheck, ReceiptText, ShoppingCart, Wallet } from "lucide-react";
import type { FlowRecord, FlowScene } from "@/lib/flowMap";

/**
 * Buying process map data — same interactive pattern as `salesFlowMap.ts`/
 * `manufacturingFlowMap.ts`, rendered by the shared `FlowMap`/`FlowNodeDialog` components
 * (`lib/flowMap.ts`'s doc comment explains why this is shared-component-plus-per-module-data
 * rather than a forked copy of the rendering code). Node/edge coordinates for this single
 * scene are copied verbatim from `salesFlowMap.ts`'s "standard" scene (proven to render
 * correctly) rather than inventing new SVG geometry from scratch — same precedent
 * `manufacturingFlowMap.ts` already established.
 *
 * Only one scene, unlike Sales (4 scenes) or Manufacturing (2 scenes): this app's real
 * branching in Buying is already fully expressed through the `optional` flag on
 * `materialRequest`/`rfq`/`supplierQuotation`/`purchaseReceipt` — Material Request -> RFQ ->
 * Supplier Quotation is a single non-skippable 3-hop chain when used at all (live-confirmed
 * 2026-09-16: no direct Material Request -> Purchase Order action exists in this app), but
 * the whole block can be skipped by creating a standalone Purchase Order instead; a Purchase
 * Order can likewise be invoiced directly, skipping Purchase Receipt. A second scene would
 * only relabel the same nodes, so — unlike Manufacturing's genuinely distinct planned/direct
 * routes — one scene captures every real path here.
 *
 * `href: null` marks a stage with no real page in this app yet (Supplier Payment) — same
 * "Coming soon" treatment as `salesFlowMap.ts`'s Customer Payment gap.
 */

export type BuyingFlowNodeKey =
  | "supplier"
  | "materialRequest"
  | "rfq"
  | "supplierQuotation"
  | "purchaseOrder"
  | "purchaseReceipt"
  | "purchaseInvoice"
  | "payment";

export type BuyingFlowSceneId = "standard";

export const BUYING_FLOW_SCENE_ORDER: BuyingFlowSceneId[] = ["standard"];

export const BUYING_FLOW_RECORDS: Record<BuyingFlowNodeKey, FlowRecord<BuyingFlowNodeKey>> = {
  supplier: {
    key: "supplier",
    title: "Supplier",
    subtitle: "Business partner master",
    icon: Building2,
    kind: "Master data",
    area: "Buying",
    href: "/master-data/suppliers",
    purpose: "Maintain the supplier, contacts, addresses and payment terms used by every purchasing document.",
    effects: ["No stock movement.", "No accounting posting from maintaining a supplier record."],
    note: "Canonical Master Data entity, same as Customer on the Sales side.",
  },
  materialRequest: {
    key: "materialRequest",
    title: "Material Request",
    subtitle: "Internal request to buy",
    icon: ClipboardList,
    kind: "Optional planning document",
    area: "Buying",
    href: "/buying/material-requests",
    purpose: "Record an internal request for items to be purchased, before any commercial document exists.",
    effects: ["No stock movement or accounting posting from a Material Request, at any stage."],
    note: "The only built path onward is \"Create RFQ\" — there is no direct Material Request -> Purchase Order action in this app (live-confirmed 2026-09-16). Skip straight to a standalone Purchase Order if a formal quotation round isn't needed.",
  },
  rfq: {
    key: "rfq",
    title: "Request for Quotation",
    subtitle: "Ask suppliers to bid",
    icon: FilePenLine,
    kind: "Optional sourcing document",
    area: "Buying",
    href: "/buying/request-for-quotations",
    purpose: "Send the requested items to one or more suppliers to solicit pricing.",
    effects: ["No stock movement or accounting posting."],
    note: "Only reachable from a Submitted Material Request in this app — no standalone creation, same convention as Pick List only being reachable from a Sales Order.",
  },
  supplierQuotation: {
    key: "supplierQuotation",
    title: "Supplier Quotation",
    subtitle: "Supplier's quoted price",
    icon: FileSpreadsheet,
    kind: "Optional sourcing document",
    area: "Buying",
    href: "/buying/supplier-quotations",
    purpose: "Record a specific supplier's quoted price and terms in response to an RFQ.",
    effects: ["No stock movement or accounting posting."],
    note: "Only reachable from a Submitted RFQ. Its \"Create Purchase Order\" action pre-fills the standalone Purchase Order form with the quotation's supplier/items — no partial-quantity line picker, unlike Sales' Quotation -> Sales Order flow.",
  },
  purchaseOrder: {
    key: "purchaseOrder",
    title: "Purchase Order",
    subtitle: "Confirm supplier terms",
    icon: ShoppingCart,
    kind: "Purchase document",
    area: "Buying",
    href: "/buying/purchase-orders",
    purpose: "Confirm the agreed quantities, price and delivery terms with a specific supplier.",
    effects: ["No stock movement while Draft.", "No accounting posting from a standard Purchase Order."],
    note: "Can be created directly (no upstream document) or from a Submitted Supplier Quotation. Live-confirmed 2026-09-16: tracks per_received/per_billed exactly — a 12-of-30 partial receipt showed 40.0%.",
  },
  purchaseReceipt: {
    key: "purchaseReceipt",
    title: "Purchase Receipt",
    subtitle: "Receive the goods",
    icon: PackageCheck,
    kind: "Stock document",
    area: "Inventory",
    href: "/buying/purchase-receipts",
    purpose: "Record goods physically received from the supplier, against open Purchase Order quantities.",
    effects: [
      "Increases stock in the target warehouse (Bin.actual_qty) — live-confirmed 2026-09-16, +12 exact match on a partial receipt.",
      "Writes received_qty back onto the Purchase Order's items.",
    ],
    note: "Has no standalone create form — only reachable from a Submitted Purchase Order. Multiple partial receipts against the same order are supported, same shape as every other create-from-source action in this app.",
  },
  purchaseInvoice: {
    key: "purchaseInvoice",
    title: "Purchase Invoice",
    subtitle: "Record the payable",
    icon: ReceiptText,
    kind: "Accounting document",
    area: "Finance",
    href: "/buying/purchase-invoices",
    purpose: "Record the supplier payable and the applicable expense accounting.",
    effects: [
      "Posts the supplier payable using the company's default payable/expense accounts — live-confirmed 2026-09-16.",
      "If based on a Purchase Receipt, does not repeat its stock movement.",
    ],
    note: "Can be created from a Purchase Receipt, or directly from a Purchase Order (the \"skip the receipt\" path) — both are live-confirmed create-from-source actions in this app.",
  },
  payment: {
    key: "payment",
    title: "Supplier Payment",
    subtitle: "Pay & allocate cash",
    icon: Wallet,
    kind: "Banking document",
    area: "Finance",
    href: null,
    purpose: "Record payment made to the supplier and allocate it to invoices or an on-account balance.",
    effects: ["Reduces the allocated supplier balance.", "Does not post the expense a second time."],
    note: "Listed as \"Coming soon\" — not yet built. Same Customer Payment gap already noted on the Sales side.",
  },
};

export const BUYING_FLOW_SCENES: Record<BuyingFlowSceneId, FlowScene<BuyingFlowNodeKey, BuyingFlowSceneId>> = {
  standard: {
    id: "standard",
    name: "Standard purchasing",
    title: "From request to payment",
    hint: "Material Request, RFQ and Supplier Quotation are an optional sourcing block — skip all three and create a Purchase Order directly if a formal quotation round isn't needed. Purchase Receipt is optional too: a Purchase Order can be invoiced directly.",
    height: 610,
    lanes: [
      { label: "01  SOURCE & QUOTE", x: 34, y: 40 },
      { label: "02  ORDER, RECEIVE & PAY", x: 34, y: 280 },
    ],
    nodes: [
      { key: "supplier", x: 42, y: 74, order: "01" },
      { key: "materialRequest", x: 342, y: 74, order: "02", optional: true },
      { key: "rfq", x: 642, y: 74, order: "03", optional: true, titleSize: 13 },
      { key: "supplierQuotation", x: 942, y: 74, order: "04", optional: true, titleSize: 13 },
      { key: "purchaseOrder", x: 942, y: 314, order: "05" },
      { key: "purchaseReceipt", x: 642, y: 314, order: "06", optional: true },
      { key: "purchaseInvoice", x: 342, y: 314, order: "07" },
      { key: "payment", x: 42, y: 314, order: "08" },
    ],
    edges: [
      { from: "supplier", to: "materialRequest", path: "M260 140 H330" },
      { from: "materialRequest", to: "rfq", path: "M560 140 H630" },
      { from: "rfq", to: "supplierQuotation", path: "M860 140 H930" },
      { from: "supplierQuotation", to: "purchaseOrder", path: "M1051 206 V302", label: "Submit & convert", lx: 1051, ly: 260 },
      { from: "purchaseOrder", to: "purchaseReceipt", path: "M942 380 H872" },
      { from: "purchaseReceipt", to: "purchaseInvoice", path: "M642 380 H572" },
      { from: "purchaseInvoice", to: "payment", path: "M342 380 H272" },
    ],
    shortcuts: [],
    note: "A Purchase Order can be created directly, without any of the sourcing documents above. Multiple partial receipts and invoices against the same order are supported.",
  },
};
