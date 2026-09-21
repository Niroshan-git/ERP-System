import { ArrowLeftRight, Boxes, Layers, PackageCheck, PackageOpen, ScanBarcode, Warehouse } from "lucide-react";
import type { FlowRecord, FlowScene } from "@/lib/flowMap";

/**
 * Inventory (Stock module) process map data — same interactive pattern as
 * `salesFlowMap.ts`/`manufacturingFlowMap.ts`/`buyingFlowMap.ts`, rendered by the shared
 * `FlowMap`/`FlowNodeDialog` components (`lib/flowMap.ts`'s doc comment). Edge geometry
 * reuses only plain horizontal/vertical segments already proven elsewhere in this app
 * (a straight vertical drop, then a horizontal chain) rather than inventing a fan-in/
 * fan-out diagram — Material Issue/Receipt/Transfer are three independent operations, not
 * a required sequence, so the horizontal chain across them is a reading order, not a
 * causal one; the scene's own hint text says so explicitly.
 *
 * Unlike Sales/Buying/Manufacturing, this module has no single linear document chain —
 * Stock Entry's three purposes can each be used independently, and Batch/Serial No are
 * per-item tracking dimensions rather than sequential stages. One scene is enough; a
 * second "variant" would only reorder the same nodes.
 */

export type StockFlowNodeKey =
  | "warehouse"
  | "batch"
  | "serialNo"
  | "materialReceipt"
  | "materialTransfer"
  | "materialIssue"
  | "stockBalance";

export type StockFlowSceneId = "movements";

export const STOCK_FLOW_SCENE_ORDER: StockFlowSceneId[] = ["movements"];

export const STOCK_FLOW_RECORDS: Record<StockFlowNodeKey, FlowRecord<StockFlowNodeKey>> = {
  warehouse: {
    key: "warehouse",
    title: "Warehouse",
    subtitle: "Storage location master",
    icon: Warehouse,
    kind: "Master data",
    area: "Inventory",
    href: "/master-data/warehouses",
    purpose: "Define the storage locations every stock movement and balance is scoped to.",
    effects: ["No stock movement or accounting posting from creating a warehouse."],
    note: "Canonical Master Data entity — Stock, Buying, Sales and Manufacturing all reference the same Warehouse records.",
  },
  batch: {
    key: "batch",
    title: "Batch",
    subtitle: "Lot tracking",
    icon: Layers,
    kind: "Optional tracking",
    area: "Inventory",
    href: "/stock/batches",
    purpose: "Track a specific production/receipt lot of an item, with an optional expiry date.",
    effects: ["No stock movement from creating a Batch record itself."],
    note: "Live-verified 2026-09-16: creating a Batch is blocked by ERPNext's own rule unless the Item has has_batch_no=1 — no Item on this instance is batch-tracked yet, so this stays structurally built but unexercised beyond that validation.",
  },
  serialNo: {
    key: "serialNo",
    title: "Serial No",
    subtitle: "Unit-level tracking",
    icon: ScanBarcode,
    kind: "Optional tracking",
    area: "Inventory",
    href: "/stock/serial-nos",
    purpose: "Track one physically-serialized unit of an item individually.",
    effects: ["No stock movement from creating a Serial No record by itself."],
    note: "Create and delete both live-verified 2026-09-16.",
  },
  materialReceipt: {
    key: "materialReceipt",
    title: "Material Receipt",
    subtitle: "Bring stock in",
    icon: PackageCheck,
    kind: "Stock Entry",
    area: "Inventory",
    href: "/stock/stock-entries",
    purpose: "Bring stock into a warehouse with no source document — e.g. found stock or an opening balance.",
    effects: [
      "Increases the target warehouse's Bin.actual_qty — live-verified 2026-09-16 (submit + Bin check) across all three purposes.",
      "The only purpose where this form accepts a manual Rate.",
    ],
    note: "Distinguished from Purchase Receipt: this is stock arriving with no Purchase Order or Supplier behind it.",
  },
  materialTransfer: {
    key: "materialTransfer",
    title: "Material Transfer",
    subtitle: "Move between warehouses",
    icon: ArrowLeftRight,
    kind: "Stock Entry",
    area: "Inventory",
    href: "/stock/stock-entries",
    purpose: "Move stock from one warehouse to another within the same company.",
    effects: ["Decreases the source warehouse and increases the target warehouse in the same document."],
    note: "This app's form applies one header-level \"to\" warehouse to every line — no per-line target warehouse yet (a documented app limitation, not an ERPNext one).",
  },
  materialIssue: {
    key: "materialIssue",
    title: "Material Issue",
    subtitle: "Take stock out",
    icon: PackageOpen,
    kind: "Stock Entry",
    area: "Inventory",
    href: "/stock/stock-entries",
    purpose: "Remove stock from a warehouse with no destination — e.g. scrap, internal consumption or samples.",
    effects: ["Decreases the source warehouse's Bin.actual_qty.", "ERPNext computes basic_rate from existing stock valuation — no manual Rate here."],
    note: "Supports the same batch/serial picker as Delivery Note for outbound lines.",
  },
  stockBalance: {
    key: "stockBalance",
    title: "Stock Balance",
    subtitle: "Live quantity on hand",
    icon: Boxes,
    kind: "Read-only report",
    area: "Inventory",
    href: "/stock/stock-balance",
    purpose: "Show the current on-hand quantity per item and warehouse.",
    effects: ["A read view only — no stock or accounting impact."],
    note: "Backed directly by the Bin doctype in this app, not ERPNext's own \"Stock Balance\" Script Report — that report only runs as a background job this app has no polling machinery for (live-confirmed 2026-09-16).",
  },
};

export const STOCK_FLOW_SCENES: Record<StockFlowSceneId, FlowScene<StockFlowNodeKey, StockFlowSceneId>> = {
  movements: {
    id: "movements",
    name: "Stock movements",
    title: "Warehouse-scoped stock movement",
    hint: "Material Receipt, Transfer and Issue are independent operations you can use any time, not a required sequence. Batch/Serial No tracking is optional and depends on the item master.",
    height: 610,
    lanes: [
      { label: "SETUP & TRACKING", x: 34, y: 40 },
      { label: "MOVEMENT & VISIBILITY", x: 34, y: 280 },
    ],
    nodes: [
      { key: "warehouse", x: 42, y: 74, order: "01" },
      { key: "batch", x: 342, y: 74, order: "02", optional: true },
      { key: "serialNo", x: 642, y: 74, order: "03", optional: true },
      { key: "materialReceipt", x: 42, y: 314, order: "04", titleSize: 13 },
      { key: "materialTransfer", x: 342, y: 314, order: "05", titleSize: 13 },
      { key: "materialIssue", x: 642, y: 314, order: "06", titleSize: 13 },
      { key: "stockBalance", x: 942, y: 314, order: "07" },
    ],
    edges: [
      { from: "warehouse", to: "materialReceipt", path: "M151 206 V302", label: "Warehouse-scoped", lx: 151, ly: 260 },
      { from: "materialReceipt", to: "materialTransfer", path: "M260 380 H330" },
      { from: "materialTransfer", to: "materialIssue", path: "M560 380 H630" },
      { from: "materialIssue", to: "stockBalance", path: "M860 380 H930" },
    ],
    shortcuts: [],
    note: "Purchase Receipt (Buying) and the Manufacture Stock Entry (Manufacturing) also move stock and update this same Bin data — see their own flow maps.",
  },
};
