import { Boxes, CircleCheck, ClipboardList, Cog, Factory, HardHat, ListChecks, ListTree } from "lucide-react";
import type { FlowRecord, FlowScene } from "@/lib/flowMap";

/**
 * Manufacturing process map data — same interactive pattern as `salesFlowMap.ts`, rendered by
 * the shared `FlowMap`/`FlowNodeDialog` components (`lib/flowMap.ts`'s doc comment explains why
 * this is shared-component-plus-per-module-data rather than a forked copy of the rendering
 * code — matching this app's `LineChart` precedent). The two scenes below reuse the Sales
 * "standard"/"reserve" scenes' exact node/edge coordinates (proven to render correctly) rather
 * than inventing new SVG geometry from scratch.
 *
 * `href: null` marks a stage with no dedicated page in this app yet (Job Card, Manufacture
 * Stock Entry) — same "Coming soon" treatment as `salesFlowMap.ts`.
 */

export type MfgFlowNodeKey =
  | "bom"
  | "salesOrder"
  | "prodPlan"
  | "workOrder"
  | "materialTransfer"
  | "jobCard"
  | "manufactureEntry"
  | "complete";

export type MfgFlowSceneId = "planned" | "direct";

export const MFG_FLOW_SCENE_ORDER: MfgFlowSceneId[] = ["planned", "direct"];

export const MFG_FLOW_RECORDS: Record<MfgFlowNodeKey, FlowRecord<MfgFlowNodeKey>> = {
  bom: {
    key: "bom",
    title: "BOM",
    subtitle: "Bill of Materials",
    icon: ListTree,
    kind: "Master data",
    area: "Master Data",
    href: "/master-data/boms",
    purpose: "Define the recipe: the production item, quantity, required raw materials and (optionally) operations/workstations.",
    effects: ["No inventory movement.", "No accounting posting from maintaining a BOM."],
    note: "An item's own default_bom is what lets \"New Work Order\" offer that item as manufacturable in this app — a frontend-only restriction, not an ERPNext requirement.",
  },
  salesOrder: {
    key: "salesOrder",
    title: "Sales Order",
    subtitle: "Optional demand source",
    icon: ClipboardList,
    kind: "Optional demand source",
    area: "Sales",
    href: "/sales/orders",
    purpose: "Ties production to a specific customer order rather than a stock/forecast build.",
    effects: ["No stock movement or accounting posting from linking a Sales Order to production."],
    note: "A Work Order or Production Plan can just as well be created with no Sales Order at all, for make-to-stock production.",
  },
  prodPlan: {
    key: "prodPlan",
    title: "Production Plan",
    subtitle: "Aggregate & plan demand",
    icon: ListChecks,
    kind: "Planning document",
    area: "Manufacturing",
    href: "/manufacturing/production-plans",
    purpose: "Aggregate demand from one or more Sales Orders, compute raw-material requirements, and generate the resulting Work Order(s).",
    effects: [
      "Submitting can reserve quantity (Bin.reserved_qty_for_production_plan) when raw-material rows exist.",
      "No GL Entry from Production Plan itself, at any stage — live-confirmed.",
    ],
    note: "Full lifecycle is built: create, submit, Make Work Order, Make Material Request (for a raw-material shortfall, leading to Buying's Material Request → Purchase Order — not shown as its own stage here), and cancel with real cascade rules.",
  },
  workOrder: {
    key: "workOrder",
    title: "Work Order",
    subtitle: "Production document",
    icon: Factory,
    kind: "Production document",
    area: "Manufacturing",
    href: "/manufacturing/work-orders",
    purpose: "The actual production document: item, BOM, quantity, warehouses, and — once submitted — the authority to transfer materials.",
    effects: [
      "No stock movement while Draft.",
      "Submit requires a WIP warehouse (ERPNext's own validate_warehouse() check) and is what unlocks Material Transfer.",
    ],
    note: "Can be created directly, or generated from a Production Plan's \"Make Work Order\". Submit is built; Cancel is not yet built in this app.",
  },
  materialTransfer: {
    key: "materialTransfer",
    title: "Material Transfer",
    subtitle: "Issue to WIP",
    icon: Boxes,
    kind: "Stock Entry (Material Transfer for Manufacture)",
    area: "Inventory",
    href: "/stock/stock-entries",
    purpose: "Move the Work Order's required raw materials from the source warehouse into the WIP warehouse.",
    effects: [
      "Reduces stock in the source warehouse, increases WIP warehouse stock.",
      "Writes transferred_qty back onto the Work Order's required items.",
    ],
    note: "Only available once the Work Order is Submitted. Partial and multiple transfers against the same Work Order are supported.",
  },
  jobCard: {
    key: "jobCard",
    title: "Job Card",
    subtitle: "Shop-floor execution",
    icon: HardHat,
    kind: "Shop-floor execution",
    area: "Manufacturing",
    href: null,
    purpose: "Track each BOM operation (e.g. Assembly, Coating) against its workstation, quantity and time as the shop floor executes it.",
    effects: ["Records progress per operation.", "Can carry a Quality Inspection Template/result where configured."],
    note: "Visible read-only inside a Work Order's own Job Cards tab in this app — there is no dedicated Job Card list/detail page yet.",
  },
  manufactureEntry: {
    key: "manufactureEntry",
    title: "Manufacture",
    subtitle: "Consume & receive stock",
    icon: Cog,
    kind: "Stock Entry (Manufacture)",
    area: "Inventory",
    href: null,
    purpose: "Once operations are complete, consume the transferred raw materials from WIP and receive the finished goods into the target warehouse.",
    effects: [
      "Writes the Work Order's consumed_qty and produced_qty.",
      "The real stock/costing event of production — everything upstream is planning.",
    ],
    note: "Not yet built in this app's frontend (no Manufacture-purpose Stock Entry UI). Exists today only via ERPNext Desk or a direct API call.",
  },
  complete: {
    key: "complete",
    title: "Completed",
    subtitle: "Produced & stocked",
    icon: CircleCheck,
    kind: "Process outcome",
    area: "Manufacturing",
    href: "/manufacturing/work-orders",
    purpose: "Confirm produced_qty has reached the Work Order's target quantity.",
    effects: ["A process status, not another document."],
    note: "A Work Order can be Submitted and fully materials-transferred while production is still in progress — completion tracks produced_qty specifically.",
  },
};

export const MFG_FLOW_SCENES: Record<MfgFlowSceneId, FlowScene<MfgFlowNodeKey, MfgFlowSceneId>> = {
  planned: {
    id: "planned",
    name: "Production Plan route",
    title: "From demand to finished goods",
    hint: "The recommended route when production is driven by planned or aggregated demand. Optional stages can be skipped; arrows show business sequence, not mandatory one-to-one document copying.",
    height: 610,
    lanes: [
      { label: "01  PLAN & CONFIRM", x: 34, y: 40 },
      { label: "02  PRODUCE & COMPLETE", x: 34, y: 280 },
    ],
    nodes: [
      { key: "bom", x: 42, y: 74, order: "01" },
      { key: "salesOrder", x: 342, y: 74, order: "02", optional: true },
      { key: "prodPlan", x: 642, y: 74, order: "03" },
      { key: "workOrder", x: 942, y: 74, order: "04" },
      { key: "materialTransfer", x: 942, y: 314, order: "05", titleSize: 13 },
      { key: "jobCard", x: 642, y: 314, order: "06" },
      { key: "manufactureEntry", x: 342, y: 314, order: "07" },
      { key: "complete", x: 42, y: 314, order: "08" },
    ],
    edges: [
      { from: "bom", to: "salesOrder", path: "M260 140 H330" },
      { from: "salesOrder", to: "prodPlan", path: "M560 140 H630" },
      { from: "prodPlan", to: "workOrder", path: "M860 140 H930" },
      { from: "workOrder", to: "materialTransfer", path: "M1051 206 V302", label: "Submit & issue materials", lx: 1051, ly: 260 },
      { from: "materialTransfer", to: "jobCard", path: "M942 380 H872" },
      { from: "jobCard", to: "manufactureEntry", path: "M642 380 H572" },
      { from: "manufactureEntry", to: "complete", path: "M342 380 H272" },
    ],
    shortcuts: [{ area: "Alternative route", label: "Work Order without a plan", scene: "direct" }],
    note: "A raw-material shortfall's Material Request (and any resulting Purchase Order) comes off the Production Plan stage — see its own notes — and isn't drawn as a separate stage here.",
  },
  direct: {
    id: "direct",
    name: "Direct Work Order",
    title: "Skip the plan. Produce against the BOM directly.",
    hint: "Make-to-stock or ad hoc production without aggregating demand through a Production Plan first.",
    height: 610,
    lanes: [
      { label: "PRODUCE", x: 34, y: 40 },
      { label: "EXECUTE & COMPLETE", x: 34, y: 310 },
    ],
    nodes: [
      { key: "bom", x: 42, y: 74, order: "01" },
      { key: "workOrder", x: 342, y: 74, order: "02" },
      { key: "materialTransfer", x: 642, y: 74, order: "03", titleSize: 13 },
      { key: "jobCard", x: 942, y: 74, order: "04" },
      { key: "manufactureEntry", x: 342, y: 354, order: "05" },
      { key: "complete", x: 942, y: 354, order: "06" },
    ],
    edges: [
      { from: "bom", to: "workOrder", path: "M260 140 H330" },
      { from: "workOrder", to: "materialTransfer", path: "M560 140 H630" },
      { from: "materialTransfer", to: "jobCard", path: "M860 140 H930" },
      { from: "workOrder", to: "manufactureEntry", path: "M451 206 V342", label: "Execute without a Production Plan", lx: 451, ly: 286 },
      { from: "manufactureEntry", to: "complete", path: "M560 420 H930", label: "Production posted", lx: 745, ly: 406 },
      { from: "jobCard", to: "complete", path: "M1051 206 V342", label: "Operations complete", lx: 1051, ly: 286 },
    ],
    shortcuts: [],
    note: "Same downstream stages as the planned route — only the demand-aggregation step is skipped.",
  },
};
