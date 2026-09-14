"use client";

import { useState } from "react";
import Link from "next/link";
import type { Connection } from "@/lib/connections";
import type { RelationshipNode } from "@/lib/relationshipMap";
import { DocActionBar } from "@/components/DocActionBar";
import { RelationshipMap } from "@/components/RelationshipMap";

type DocActionState = { error?: string } | undefined;

type CreateAction =
  | { label: string; action: (state: DocActionState, formData: FormData) => Promise<DocActionState> }
  /** Link variant — used when "Create X" needs an intermediate step (e.g. line
   * selection for partial fulfillment) rather than a single-click submit. */
  | { label: string; href: string };

export function ConnectionsPanel({
  connections,
  createAction,
  createActions,
  relationshipMap,
}: {
  connections: Connection[];
  /** Single creation entry point — kept for backwards compatibility with existing callers
   * (Quotation, Sales Invoice) that only ever offer one "Create X" action. */
  createAction?: CreateAction;
  /** Multiple creation entry points shown side by side — needed once a doctype gains more
   * than one downstream document it can create (Sales Order -> Delivery Note AND Sales
   * Order -> Sales Invoice). Takes precedence over `createAction` if both are given. */
  createActions?: CreateAction[];
  /** Full multi-hop document-flow chain (lib/relationshipMap.ts), pre-built server-side.
   * Optional per caller — when present, a List/Map toggle appears above the connections. */
  relationshipMap?: RelationshipNode[];
}) {
  const [view, setView] = useState<"list" | "map">("list");
  const actions = createActions ?? (createAction ? [createAction] : []);

  if (connections.length === 0 && actions.length === 0) {
    return <p className="text-sm text-graphite-500">No linked documents.</p>;
  }

  return (
    <div className="space-y-6">
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {actions.map((action) =>
            "href" in action ? (
              <Link
                key={action.label}
                href={action.href}
                className="inline-block rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90"
              >
                {action.label}
              </Link>
            ) : (
              <DocActionBar key={action.label} action={action.action} label={action.label} pendingLabel="Creating…" />
            ),
          )}
        </div>
      )}

      {relationshipMap && relationshipMap.length > 0 && (
        <div className="inline-flex rounded-md border border-border p-0.5 text-sm">
          <button
            type="button"
            onClick={() => setView("list")}
            className={`rounded px-3 py-1 font-medium ${view === "list" ? "bg-signal text-white" : "text-graphite-500 hover:text-graphite-900"}`}
          >
            List
          </button>
          <button
            type="button"
            onClick={() => setView("map")}
            className={`rounded px-3 py-1 font-medium ${view === "map" ? "bg-signal text-white" : "text-graphite-500 hover:text-graphite-900"}`}
          >
            Map
          </button>
        </div>
      )}

      {view === "map" && relationshipMap && relationshipMap.length > 0 ? (
        <RelationshipMap roots={relationshipMap} />
      ) : (
        connections.map((connection) => (
          <div key={connection.label}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-graphite-500">
              {connection.label}
            </h3>
            {connection.docs.length === 0 ? (
              <p className="text-sm text-graphite-500">None yet.</p>
            ) : (
              <ul className="space-y-1">
                {connection.docs.map((docName) => (
                  <li key={docName}>
                    <Link
                      href={`${connection.href}/${encodeURIComponent(docName)}`}
                      className="font-mono text-sm text-signal hover:underline"
                    >
                      {docName}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))
      )}
    </div>
  );
}
