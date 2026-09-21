"use client";

import { FlowMap } from "@/components/FlowMap";
import { BUYING_FLOW_RECORDS, BUYING_FLOW_SCENES, BUYING_FLOW_SCENE_ORDER } from "@/lib/buyingFlowMap";

/**
 * Thin client wrapper around the shared, generic `FlowMap` — same reasoning as
 * `SalesFlowMap`/`ManufacturingFlowMap`'s own wrappers: `BUYING_FLOW_RECORDS` embeds
 * `LucideIcon` component references, which cannot cross the Server Component -> Client
 * Component prop boundary as plain data. Importing the data here, inside a "use client"
 * module, keeps `FlowMap`/`FlowNodeDialog` fully generic and shared while satisfying that
 * RSC constraint.
 */
const BUYING_FLOW_NOTES = (
  <>
    <p>
      This is a Ceylon Stack workflow-navigation map of this app&apos;s own Buying module, not a
      live ERPNext Desk screen. The full Material Request -&gt; RFQ -&gt; Supplier Quotation -&gt;
      Purchase Order -&gt; Purchase Receipt -&gt; Purchase Invoice chain was driven end to end
      against the live instance on 2026-09-16 (see PROGRESS.md&apos;s &quot;Buying core cycle&quot;
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

export function BuyingFlowMap() {
  return (
    <FlowMap
      records={BUYING_FLOW_RECORDS}
      scenes={BUYING_FLOW_SCENES}
      sceneOrder={BUYING_FLOW_SCENE_ORDER}
      defaultScene="standard"
      idPrefix="buying-flow"
      downloadFilePrefix="ceylonstack-buying-flow"
      tablistLabel="Buying process variants"
      notes={BUYING_FLOW_NOTES}
    />
  );
}
