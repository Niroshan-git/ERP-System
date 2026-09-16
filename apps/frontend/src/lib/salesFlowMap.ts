import {
  CircleCheck,
  ClipboardCheck,
  ClipboardList,
  FileClock,
  FileLock2,
  FileMinus,
  FilePenLine,
  FileSpreadsheet,
  HandCoins,
  Landmark,
  PackageCheck,
  PackageOpen,
  ReceiptText,
  Target,
  Truck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/**
 * SAP B1-style sales process map — ported from the user-supplied concept file, kept
 * pixel-exact on layout (1200x{height} viewBox, 218x132 node boxes, the same edge paths)
 * so the diagram structure matches "exactly", but re-skinned onto Ceylon Stack's own
 * design tokens (graphite-900/500, surface, canvas, border, signal — see globals.css)
 * instead of the concept's own bespoke blue/cyan palette, so it inherits this app's real
 * light/dark theme automatically rather than duplicating a second theme system.
 *
 * `href: null` marks a stage with no real page in this app yet (Opportunity,
 * Down Payment*, Reserve Invoice, Return Request, Replacement Delivery, Credit Note,
 * Apply Credit/Refund) — same "Coming soon" treatment Sidebar.tsx already uses for
 * Customer Payments/Sales Returns/Credit Notes, extended here to the rest of the concept.
 * Pick & Pack (`pick`) is built — see /sales/pick-lists.
 */

export type FlowNodeKey =
  | "customer"
  | "opportunity"
  | "quote"
  | "order"
  | "pick"
  | "delivery"
  | "invoice"
  | "payment"
  | "dpRequest"
  | "dpInvoice"
  | "advance"
  | "finalInvoice"
  | "balance"
  | "reserve"
  | "complete"
  | "rma"
  | "returned"
  | "redelivery"
  | "credit"
  | "refund";

export type FlowRecord = {
  key: FlowNodeKey;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  kind: string;
  area: string;
  href: string | null;
  purpose: string;
  effects: string[];
  note: string;
};

export type FlowEdge = {
  from: string;
  to: string;
  path: string;
  label?: string;
  lx?: number;
  ly?: number;
  optional?: boolean;
};

export type FlowNodePlacement = { key: FlowNodeKey; x: number; y: number; order: string; optional?: boolean; titleSize?: number };

export type FlowShortcut = { area: string; label: string; scene: FlowSceneId };

export type FlowSceneId = "standard" | "advances" | "reserve" | "returns";

export type FlowScene = {
  id: FlowSceneId;
  name: string;
  title: string;
  hint: string;
  height: number;
  lanes: { label: string; x: number; y: number }[];
  nodes: FlowNodePlacement[];
  edges: FlowEdge[];
  shortcuts: FlowShortcut[];
  note: string;
};

export const FLOW_RECORDS: Record<FlowNodeKey, FlowRecord> = {
  customer: {
    key: "customer",
    title: "Customer",
    subtitle: "Business partner master",
    icon: Users,
    kind: "Master data",
    area: "Sales",
    href: "/sales/customers",
    purpose: "Maintain the customer, contacts, addresses, payment terms and price list used by every sales document.",
    effects: ["No inventory movement.", "No accounting posting from maintaining a customer record."],
    note: "Set up the customer (and item master data/prices) before creating a Quotation or Sales Order against them.",
  },
  opportunity: {
    key: "opportunity",
    title: "Sales opportunity",
    subtitle: "Qualify & forecast",
    icon: Target,
    kind: "Optional CRM",
    area: "Sales",
    href: null,
    purpose: "Track a potential deal, activities, probability and expected value before any commercial document exists.",
    effects: ["No inventory movement.", "No accounting entry."],
    note: "Not yet built in Ceylon Stack. A Quotation or Sales Order can already be created directly, without an opportunity.",
  },
  quote: {
    key: "quote",
    title: "Quotation",
    subtitle: "Offer price & terms",
    icon: FilePenLine,
    kind: "Sales document",
    area: "Sales",
    href: "/sales/quotations",
    purpose: "Offer items, quantities, prices and terms to the customer before they commit.",
    effects: ["No physical stock movement.", "No revenue or receivable posting."],
    note: "Optional in the cycle. Accepted lines convert into a Sales Order, in full or partially.",
  },
  order: {
    key: "order",
    title: "Sales Order",
    subtitle: "Confirm customer demand",
    icon: ClipboardList,
    kind: "Sales document",
    area: "Sales",
    href: "/sales/orders",
    purpose: "Record the agreed customer quantities, price and delivery requirements.",
    effects: ["No stock is deducted yet.", "No accounting journal from a standard Sales Order."],
    note: "Partial fulfilment can leave open quantities — this app tracks % delivered and % billed per order.",
  },
  pick: {
    key: "pick",
    title: "Pick & Pack",
    subtitle: "Prepare the shipment",
    icon: PackageCheck,
    kind: "Optional operation",
    area: "Inventory",
    href: "/sales/pick-lists",
    purpose: "Release eligible order lines for picking, select stock and prepare the shipment.",
    effects: ["Operational step — the Delivery Note is what actually records the goods issue.", "No independent revenue posting."],
    note: "Optional — a Delivery Note can still be created directly from a Sales Order without a Pick List.",
  },
  delivery: {
    key: "delivery",
    title: "Delivery Note",
    subtitle: "Dispatch the goods",
    icon: Truck,
    kind: "Inventory document",
    area: "Inventory",
    href: "/sales/delivery-notes",
    purpose: "Record goods shipped to the customer, referencing open Sales Order quantities — with batch/serial tracking where needed.",
    effects: ["Reduces stock on hand for stock items.", "Records the stock value movement."],
    note: "A Sales Invoice created from this Delivery Note does not issue the same stock again. Partial and multiple deliveries are supported.",
  },
  invoice: {
    key: "invoice",
    title: "Sales Invoice",
    subtitle: "Bill the customer",
    icon: ReceiptText,
    kind: "Accounting document",
    area: "Finance",
    href: "/sales/invoices",
    purpose: "Record the customer receivable, sales revenue and applicable tax.",
    effects: ["Posts customer receivable, revenue and tax accounts.", "If based on a Delivery Note, does not repeat its stock issue."],
    note: "Can be created from a Delivery Note, or directly from a Sales Order (the \"Skip Delivery Note\" path).",
  },
  payment: {
    key: "payment",
    title: "Customer Payment",
    subtitle: "Receive & allocate cash",
    icon: Wallet,
    kind: "Banking document",
    area: "Finance",
    href: null,
    purpose: "Record customer receipts and allocate them to invoices or an on-account balance.",
    effects: ["Reduces the allocated customer balance.", "Does not recognise revenue a second time."],
    note: "Listed as \"Coming soon\" in the Sales cycle sidebar — not yet built. Partial receipts can leave invoices open.",
  },
  dpRequest: {
    key: "dpRequest",
    title: "Down payment request",
    subtitle: "Request an advance",
    icon: FileClock,
    kind: "Alternative A",
    area: "Finance",
    href: null,
    purpose: "Request a customer advance against the commercial agreement.",
    effects: ["Not itself a revenue invoice.", "No accounting journal from the request alone."],
    note: "Not yet built in Ceylon Stack. Use this OR the down payment invoice branch, not both.",
  },
  dpInvoice: {
    key: "dpInvoice",
    title: "Down payment invoice",
    subtitle: "Invoice the advance",
    icon: FileSpreadsheet,
    kind: "Alternative B",
    area: "Finance",
    href: null,
    purpose: "Create an advance-invoice document where a down-payment process is configured.",
    effects: ["Creates down-payment accounting, not the ordinary final Sales Invoice.", "Does not dispatch inventory."],
    note: "Not yet built in Ceylon Stack. Alternative to the request branch, not its next step.",
  },
  advance: {
    key: "advance",
    title: "Receive advance",
    subtitle: "Incoming payment",
    icon: Landmark,
    kind: "Banking document",
    area: "Finance",
    href: null,
    purpose: "Record the customer's advance receipt using the selected down-payment process.",
    effects: ["Records the money received.", "Retained for allocation against the final invoice."],
    note: "Not yet built in Ceylon Stack. Apply the down payment at final invoicing so the customer isn't billed twice.",
  },
  finalInvoice: {
    key: "finalInvoice",
    title: "Final Sales Invoice",
    subtitle: "Apply the down payment",
    icon: ReceiptText,
    kind: "Accounting document",
    area: "Finance",
    href: "/sales/invoices",
    purpose: "Create the final Sales Invoice and draw the eligible down payment against it.",
    effects: ["Records final invoicing and configured down-payment clearing.", "Leaves only the remaining balance, if any."],
    note: "This app's Sales Invoice page today does not yet apply a down payment automatically — the underlying document is the same Sales Invoice.",
  },
  balance: {
    key: "balance",
    title: "Balance payment",
    subtitle: "Collect the remainder",
    icon: Wallet,
    kind: "If balance remains",
    area: "Finance",
    href: null,
    purpose: "Collect and allocate only the remaining unpaid balance.",
    effects: ["Reduces the remaining receivable.", "No additional revenue recognition."],
    note: "Not yet built in Ceylon Stack (same Customer Payment gap as the standard flow).",
  },
  reserve: {
    key: "reserve",
    title: "Reserve invoice",
    subtitle: "Invoice before dispatch",
    icon: FileLock2,
    kind: "Accounting document",
    area: "Finance",
    href: null,
    purpose: "Bill items before their physical delivery, using an invoice-before-dispatch process.",
    effects: ["Records invoicing without physically issuing the stock.", "The later Delivery Note records the actual stock issue."],
    note: "Not yet surfaced as its own flow in Ceylon Stack. Avoid a second ordinary Sales Invoice for the same billed quantities.",
  },
  complete: {
    key: "complete",
    title: "Fulfilled & settled",
    subtitle: "Both branches complete",
    icon: CircleCheck,
    kind: "Process outcome",
    area: "Sales",
    href: "/",
    purpose: "Confirm that delivery obligations and the customer balance have both been completed.",
    effects: ["A process status, not another document."],
    note: "A paid invoice can still await delivery; a delivered order can still await payment.",
  },
  rma: {
    key: "rma",
    title: "Return request",
    subtitle: "Record reason & approval",
    icon: ClipboardCheck,
    kind: "Optional RMA",
    area: "Sales",
    href: null,
    purpose: "Authorize and track the customer's return request against the original document.",
    effects: ["Does not physically bring goods back into stock.", "No accounting journal from the request itself."],
    note: "Not yet built in Ceylon Stack. Optional step — base-document status and returnable quantity must be validated.",
  },
  returned: {
    key: "returned",
    title: "Sales Return",
    subtitle: "Before invoicing",
    icon: PackageOpen,
    kind: "Inventory correction",
    area: "Inventory",
    href: null,
    purpose: "Reverse an un-invoiced Delivery Note, wholly or partly, when goods are returned.",
    effects: ["Brings returned quantities back into inventory.", "Reverses the delivery's cost movement."],
    note: "Listed as \"Coming soon\" in the sidebar. ERPNext itself models this as a Delivery Note with Is Return set.",
  },
  redelivery: {
    key: "redelivery",
    title: "Replacement delivery",
    subtitle: "If replacement is agreed",
    icon: Truck,
    kind: "Optional replacement",
    area: "Inventory",
    href: null,
    purpose: "Deliver replacement quantities after the return is resolved.",
    effects: ["Records the replacement goods issue."],
    note: "Not yet built as its own workflow in Ceylon Stack. Replacement is not mandatory for every return.",
  },
  credit: {
    key: "credit",
    title: "Credit Note",
    subtitle: "After invoicing",
    icon: FileMinus,
    kind: "Accounting correction",
    area: "Finance",
    href: null,
    purpose: "Correct all or part of an invoiced sale and reduce the customer's balance.",
    effects: ["Adjusts the invoiced amount and relevant tax.", "Inventory effect depends on the correction scenario."],
    note: "Listed as \"Coming soon\" in the sidebar. ERPNext itself models this as a Sales Invoice with Is Return set.",
  },
  refund: {
    key: "refund",
    title: "Apply credit / refund",
    subtitle: "Resolve the credit balance",
    icon: HandCoins,
    kind: "As applicable",
    area: "Finance",
    href: null,
    purpose: "Allocate the credit against eligible open receivables, or refund an actual credit balance.",
    effects: ["Credit allocation or a refund clears the relevant balance."],
    note: "Not yet built in Ceylon Stack. A Credit Note does not automatically mean a cash refund is due.",
  },
};

const LONG_TITLE_SIZE = 13;

export const FLOW_SCENES: Record<FlowSceneId, FlowScene> = {
  standard: {
    id: "standard",
    name: "Standard sales",
    title: "From customer to cash",
    hint: "A typical inventory-sale route. Optional stages can be skipped; arrows show business sequence, not mandatory one-to-one document copying.",
    height: 610,
    lanes: [
      { label: "01  SELL & CONFIRM", x: 34, y: 40 },
      { label: "02  FULFIL & COLLECT", x: 34, y: 280 },
    ],
    nodes: [
      { key: "customer", x: 42, y: 74, order: "01" },
      { key: "opportunity", x: 342, y: 74, order: "02", optional: true },
      { key: "quote", x: 642, y: 74, order: "03" },
      { key: "order", x: 942, y: 74, order: "04" },
      { key: "pick", x: 942, y: 314, order: "05", optional: true },
      { key: "delivery", x: 642, y: 314, order: "06" },
      { key: "invoice", x: 342, y: 314, order: "07" },
      { key: "payment", x: 42, y: 314, order: "08" },
    ],
    edges: [
      { from: "customer", to: "opportunity", path: "M260 140 H330" },
      { from: "opportunity", to: "quote", path: "M560 140 H630" },
      { from: "quote", to: "order", path: "M860 140 H930" },
      { from: "order", to: "pick", path: "M1051 206 V302", label: "Availability / release", lx: 1051, ly: 260 },
      { from: "pick", to: "delivery", path: "M942 380 H872" },
      { from: "delivery", to: "invoice", path: "M642 380 H572" },
      { from: "invoice", to: "payment", path: "M342 380 H272" },
    ],
    shortcuts: [
      { area: "Optional routes", label: "Advance payments", scene: "advances" },
      { area: "Alternative billing", label: "Invoice before delivery", scene: "reserve" },
      { area: "Exceptions", label: "Returns & credits", scene: "returns" },
    ],
    note: "Service and direct-invoice sales can skip dispatch documents. One order can have several deliveries, invoices and payments.",
  },
  advances: {
    id: "advances",
    name: "Advance payments",
    title: "Collect an advance, then settle the balance",
    hint: "Choose the request OR the down payment invoice branch — they're alternative document approaches, not two consecutive steps.",
    height: 690,
    lanes: [{ label: "ADVANCE DOCUMENT", x: 34, y: 32 }],
    nodes: [
      { key: "order", x: 42, y: 234, order: "01" },
      { key: "dpRequest", x: 342, y: 64, order: "02A", optional: true },
      { key: "dpInvoice", x: 342, y: 404, order: "02B", optional: true },
      { key: "advance", x: 642, y: 234, order: "03" },
      { key: "delivery", x: 942, y: 64, order: "04" },
      { key: "finalInvoice", x: 942, y: 404, order: "05" },
      { key: "balance", x: 642, y: 530, order: "06", optional: true },
    ],
    edges: [
      { from: "order", to: "dpRequest", path: "M260 280 H298 V130 H330", label: "Request", lx: 284, ly: 210, optional: true },
      { from: "order", to: "dpInvoice", path: "M260 328 H298 V470 H330", label: "Invoice", lx: 282, ly: 385, optional: true },
      { from: "dpRequest", to: "advance", path: "M560 130 H600 V270 H630" },
      { from: "dpInvoice", to: "advance", path: "M560 470 H600 V328 H630" },
      { from: "advance", to: "delivery", path: "M860 280 H898 V130 H930" },
      { from: "delivery", to: "finalInvoice", path: "M1051 196 V392", label: "Final billing", lx: 1051, ly: 272 },
      { from: "finalInvoice", to: "balance", path: "M942 470 H896 V596 H872", label: "Remainder", lx: 899, ly: 560 },
    ],
    shortcuts: [],
    note: "Availability of specific down-payment documents and accounting treatment depends on your configuration.",
  },
  reserve: {
    id: "reserve",
    name: "Invoice before delivery",
    title: "Bill first. Dispatch and collect separately.",
    hint: "A reserve invoice bills the goods before dispatch. The payment and fulfilment branches can complete in either order.",
    height: 610,
    lanes: [
      { label: "INVOICE & FULFILMENT", x: 34, y: 40 },
      { label: "COLLECTION & COMPLETION", x: 34, y: 310 },
    ],
    nodes: [
      { key: "order", x: 42, y: 74, order: "01" },
      { key: "reserve", x: 342, y: 74, order: "02" },
      { key: "pick", x: 642, y: 74, order: "03", optional: true },
      { key: "delivery", x: 942, y: 74, order: "04" },
      { key: "payment", x: 342, y: 354, order: "05" },
      { key: "complete", x: 942, y: 354, order: "06" },
    ],
    edges: [
      { from: "order", to: "reserve", path: "M260 140 H330" },
      { from: "reserve", to: "pick", path: "M560 140 H630" },
      { from: "pick", to: "delivery", path: "M860 140 H930" },
      { from: "reserve", to: "payment", path: "M451 206 V342", label: "Collect before or after dispatch", lx: 451, ly: 286 },
      { from: "payment", to: "complete", path: "M560 420 H930", label: "Payment allocated", lx: 745, ly: 406 },
      { from: "delivery", to: "complete", path: "M1051 206 V342", label: "Goods delivered", lx: 1051, ly: 286 },
    ],
    shortcuts: [],
    note: "Do not add a second ordinary Sales Invoice for the same quantities already billed on the reserve invoice.",
  },
  returns: {
    id: "returns",
    name: "Returns & credits",
    title: "Resolve the issue using the original document",
    hint: "Use the upper route before invoicing and the lower route after invoicing. Return requests and replacement/refund actions are optional.",
    height: 610,
    lanes: [
      { label: "BEFORE INVOICING · DELIVERY ISSUE", x: 34, y: 40 },
      { label: "AFTER INVOICING · INVOICE CORRECTION", x: 34, y: 310 },
    ],
    nodes: [
      { key: "delivery", x: 42, y: 74, order: "A1" },
      { key: "rma", x: 342, y: 74, order: "A2", optional: true },
      { key: "returned", x: 642, y: 74, order: "A3" },
      { key: "redelivery", x: 942, y: 74, order: "A4", optional: true, titleSize: LONG_TITLE_SIZE },
      { key: "invoice", x: 42, y: 354, order: "B1" },
      { key: "rma", x: 342, y: 354, order: "B2", optional: true },
      { key: "credit", x: 642, y: 354, order: "B3" },
      { key: "refund", x: 942, y: 354, order: "B4", optional: true, titleSize: LONG_TITLE_SIZE },
    ],
    edges: [
      { from: "A1", to: "A2", path: "M260 140 H330", label: "Optional", lx: 297, ly: 124, optional: true },
      { from: "A2", to: "A3", path: "M560 140 H630" },
      { from: "A3", to: "A4", path: "M860 140 H930", label: "If agreed", lx: 899, ly: 124, optional: true },
      { from: "B1", to: "B2", path: "M260 420 H330", label: "Optional", lx: 297, ly: 404, optional: true },
      { from: "B2", to: "B3", path: "M560 420 H630" },
      { from: "B3", to: "B4", path: "M860 420 H930", label: "As needed", lx: 899, ly: 404, optional: true },
    ],
    shortcuts: [],
    note: "Validate original-document status, open quantities and previous returns/credits. Never post both correction routes for the same quantity.",
  },
};

/** dpRequest/dpInvoice titles also run long in the 218px-wide box — matches the source
 * concept's own font-size-14 treatment for those, plus the two flagged above. */
FLOW_SCENES.advances.nodes[1].titleSize = LONG_TITLE_SIZE;
FLOW_SCENES.advances.nodes[2].titleSize = LONG_TITLE_SIZE;
