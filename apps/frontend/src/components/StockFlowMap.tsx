"use client";

import { FlowMap } from "@/components/FlowMap";
import { STOCK_FLOW_RECORDS, STOCK_FLOW_SCENES, STOCK_FLOW_SCENE_ORDER } from "@/lib/stockFlowMap";

/**
 * Thin client wrapper around the shared, generic `FlowMap` — same reasoning as
 * `SalesFlowMap`/`ManufacturingFlowMap`/`BuyingFlowMap`'s own wrappers: `STOCK_FLOW_RECORDS`
 * embeds `LucideIcon` component references, which cannot cross the Server Component ->
 * Client Component prop boundary as plain data.
 */
const STOCK_FLOW_NOTES = (
  <>
    <p>
      This is a Ceylon Stack workflow-navigation map of this app&apos;s own Inventory (Stock)
      module, not a live ERPNext Desk screen. Warehouse create/update, all three Stock Entry
      purposes (submit + cancel), and Serial No create/delete were driven end to end against
      the live instance on 2026-09-16 (see PROGRESS.md&apos;s &quot;Inventory (Stock) module&quot;
      entry) — every node here links to a real, working page.
    </p>
    <p>
      Buying and Stock predate <code>docs/controls/BACKEND_KNOWLEDGE_POLICY.md</code> (added
      2026-09-17), so there is no <code>docs/backend/</code> canonical reference yet for this
      module the way Manufacturing has one — field-level detail lives in each doctype&apos;s own
      <code>actions.ts</code> and the 2026-09-16 live QA entries in <code>PROGRESS.md</code>.
      This map is a navigation aid, not a replacement for that evidence.
    </p>
  </>
);

export function StockFlowMap() {
  return (
    <FlowMap
      records={STOCK_FLOW_RECORDS}
      scenes={STOCK_FLOW_SCENES}
      sceneOrder={STOCK_FLOW_SCENE_ORDER}
      defaultScene="movements"
      idPrefix="stock-flow"
      downloadFilePrefix="ceylonstack-inventory-flow"
      tablistLabel="Inventory process variants"
      notes={STOCK_FLOW_NOTES}
    />
  );
}
