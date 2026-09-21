"use client";

import { FlowMap } from "@/components/FlowMap";
import { FLOW_RECORDS, FLOW_SCENES, SALES_FLOW_SCENE_ORDER } from "@/lib/salesFlowMap";

/**
 * Thin client wrapper around the shared, generic `FlowMap` — NOT a fork of its rendering
 * logic (that stays 100% in `FlowMap`/`FlowNodeDialog`, see `lib/flowMap.ts`'s doc comment).
 * This wrapper exists purely because of a React Server Components constraint: `FLOW_RECORDS`
 * embeds `LucideIcon` component references, and only plain serializable data can cross the
 * server->client prop boundary — a Server Component page (e.g. `sales/page.tsx`) cannot pass
 * `FLOW_RECORDS` as a prop to the client `FlowMap` directly ("Only plain objects can be passed
 * to Client Components..." / "Functions cannot be passed..." at runtime). Importing the data
 * here, inside a "use client" module, avoids crossing that boundary — the icons never need to
 * serialize because this whole module runs client-side. Sales' own "Process notes &
 * references" content lives here for the same reason (kept together with its data/config).
 */
const SALES_FLOW_NOTES = (
  <>
    <p>
      This is a Ceylon Stack workflow-navigation map inspired by SAP Business One&apos;s sales-document flow, not a
      live SAP screen or a connection to any SAP system. The standard route illustrates an inventory sale;
      quotation, opportunity, pick-and-pack and a separate delivery are not universally required. Multiple
      deliveries, consolidated invoices and partial receipts may exist.
    </p>
    <p>
      Accounting descriptions are high-level and assume applicable stock items. Account determination,
      down-payment handling, tax handling and eligible base documents depend on configuration — the reserve and
      advance-payment views are alternative process patterns, not the only ones.
    </p>
    <p>
      References:{" "}
      <a
        className="text-signal"
        href="https://learning.sap.com/courses/discovering-sap-business-one-web-client-logistics/managing-the-sales-process-in-sap-business-one-web-client_dc752693-979b-474f-8e9f-781cc4e65fc3"
        target="_blank"
        rel="noopener"
      >
        SAP Business One sales process
      </a>{" "}
      ·{" "}
      <a
        className="text-signal"
        href="https://learning.sap.com/courses/managing-logistics-in-sap-business-one/solving-issues-in-sales"
        target="_blank"
        rel="noopener"
      >
        SAP returns, return requests and credit memos
      </a>
      .
    </p>
  </>
);

export function SalesFlowMap() {
  return (
    <FlowMap
      records={FLOW_RECORDS}
      scenes={FLOW_SCENES}
      sceneOrder={SALES_FLOW_SCENE_ORDER}
      defaultScene="standard"
      idPrefix="sales-flow"
      downloadFilePrefix="ceylonstack-sales-flow"
      tablistLabel="Sales process variants"
      notes={SALES_FLOW_NOTES}
    />
  );
}
