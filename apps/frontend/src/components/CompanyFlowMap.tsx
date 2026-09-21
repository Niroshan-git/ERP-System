"use client";

import { FlowMap } from "@/components/FlowMap";
import { COMPANY_FLOW_RECORDS, COMPANY_FLOW_SCENES, COMPANY_FLOW_SCENE_ORDER } from "@/lib/companyFlowMap";

/**
 * Thin client wrapper around the shared, generic `FlowMap` — same reasoning as every other
 * per-module wrapper (`SalesFlowMap`/`ManufacturingFlowMap`/`BuyingFlowMap`/`StockFlowMap`):
 * `COMPANY_FLOW_RECORDS` embeds `LucideIcon` component references, which cannot cross the
 * Server Component -> Client Component prop boundary as plain data.
 */
const COMPANY_FLOW_NOTES = (
  <>
    <p>
      This is the company-wide, bird&apos;s-eye version of the four per-module Flow maps
      (Buying, Inventory, Manufacturing, Sales) — two high-level passes through the business,
      not a re-detailing of every stage. &quot;Procure to cash&quot; is the fullest chain,
      supply-side through to billing; &quot;Sale to cash&quot; is the customer-facing half on
      its own, ending at the actual cash-in-hand event. Each node&apos;s note links to the
      module Flow tab that has the full stage-by-stage detail, business rules, and
      live-confirmed effects for that part of the chain.
    </p>
    <p>
      Neither scene is the only path through the business: a Sales Order can be raised at any
      point, not only after production finishes, and purchased goods can be resold directly
      without a Work Order at all — see each scene&apos;s own note for its caveat.
    </p>
  </>
);

export function CompanyFlowMap() {
  return (
    <FlowMap
      records={COMPANY_FLOW_RECORDS}
      scenes={COMPANY_FLOW_SCENES}
      sceneOrder={COMPANY_FLOW_SCENE_ORDER}
      defaultScene="procureToCash"
      idPrefix="company-flow"
      downloadFilePrefix="ceylonstack-company-flow"
      tablistLabel="Company workflow variants"
      notes={COMPANY_FLOW_NOTES}
    />
  );
}
