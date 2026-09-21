"use client";

import { FlowMap } from "@/components/FlowMap";
import { MFG_FLOW_RECORDS, MFG_FLOW_SCENES, MFG_FLOW_SCENE_ORDER } from "@/lib/manufacturingFlowMap";

/**
 * Thin client wrapper around the shared, generic `FlowMap` — same reasoning as
 * `SalesFlowMap.tsx`'s doc comment: `MFG_FLOW_RECORDS` embeds `LucideIcon` component
 * references, which cannot cross the Server Component -> Client Component prop boundary as
 * plain data. Importing the data here, inside a "use client" module, keeps `FlowMap`/
 * `FlowNodeDialog` fully generic and shared (no duplicated rendering logic) while satisfying
 * that RSC constraint.
 */
const MANUFACTURING_FLOW_NOTES = (
  <>
    <p>
      This is a Ceylon Stack workflow-navigation map of this app&apos;s own Manufacturing module, not a live
      ERPNext Desk screen. It shows two real, currently-supported routes — production driven by a Production
      Plan, and a Work Order created directly against a BOM. Job Card and the final Manufacture Stock Entry are
      shown for completeness even though this frontend doesn&apos;t yet expose dedicated pages for them.
    </p>
    <p>
      Field-level detail for every stage (required fields, submit-time validation, stock/accounting impact) is
      documented in <code>docs/backend/05-manufacturing/</code> — this map is a navigation aid, not a
      replacement for that canonical reference.
    </p>
  </>
);

export function ManufacturingFlowMap() {
  return (
    <FlowMap
      records={MFG_FLOW_RECORDS}
      scenes={MFG_FLOW_SCENES}
      sceneOrder={MFG_FLOW_SCENE_ORDER}
      defaultScene="planned"
      idPrefix="mfg-flow"
      downloadFilePrefix="ceylonstack-manufacturing-flow"
      tablistLabel="Manufacturing process variants"
      notes={MANUFACTURING_FLOW_NOTES}
    />
  );
}
