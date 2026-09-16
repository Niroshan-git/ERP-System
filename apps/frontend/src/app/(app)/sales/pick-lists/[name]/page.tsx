import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { AccessDeniedNotice } from "@/components/AccessDeniedNotice";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { DocActionBar } from "@/components/DocActionBar";
import { DocField } from "@/components/DocField";
import { StatusPill } from "@/components/StatusPill";
import { ProgressBar } from "@/components/ProgressBar";
import { Breadcrumb } from "@/components/Breadcrumb";
import { DocTabs } from "@/components/DocTabs";
import { ConnectionsPanel } from "@/components/ConnectionsPanel";
import { SavedBanner } from "@/components/SavedBanner";
import { PickListLocationsTable } from "@/components/PickListLocationsTable";
import { PickListPickedQtyEditor, type EditablePickListLocation } from "@/components/PickListPickedQtyEditor";
import { ErpNextError, getDoc } from "@/lib/erpnext";
import { getConnections, type Connection } from "@/lib/connections";
import type { DocStatus } from "@/lib/docStatus";
import { pickListStatus } from "@/lib/erpStatus";
import { buildTimeline } from "@/lib/timeline";
import { postCommentAction } from "@/lib/actions/comments";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { cancelPickListAction, submitPickListAction, updatePickListPickedQtyAction } from "../actions";

type PickListLocation = {
  name: string;
  item_code: string;
  item_name: string;
  warehouse: string;
  qty: number;
  stock_qty: number;
  uom: string;
  stock_uom: string;
  conversion_factor: number;
  picked_qty: number;
  delivered_qty?: number;
  sales_order?: string;
  sales_order_item?: string;
};

type PickListDoc = {
  name: string;
  company: string;
  customer?: string;
  customer_name?: string;
  purpose: string;
  docstatus: DocStatus;
  status: string;
  per_delivered: number;
  creation: string;
  owner: string;
  modified: string;
  modified_by: string;
  locations: PickListLocation[];
};

export default async function PickListDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { name } = await params;
  const { saved } = await searchParams;

  let doc: PickListDoc;
  try {
    doc = await getDoc<PickListDoc>("Pick List", decodeURIComponent(name));
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    if (e instanceof ErpNextError && e.status === 403) {
      return (
        <div>
          <h1 className="mb-4 text-2xl font-medium text-graphite-900">{decodeURIComponent(name)}</h1>
          <AccessDeniedNotice what="this pick list" />
        </div>
      );
    }
    throw e;
  }

  const breadcrumb = (
    <Breadcrumb
      items={[
        { label: "Home", href: "/" },
        { label: "Selling", href: "/sales/pick-lists" },
        { label: "Pick List", href: "/sales/pick-lists" },
        { label: doc.customer_name || doc.customer || doc.name },
      ]}
    />
  );

  // Upstream reference (the Sales Order(s) this pick list was made from) — read directly
  // off this doc's own locations, same technique the Delivery Note detail page uses for its
  // own upstream Sales Order reference (works even in Draft, since it's part of the
  // document we already fetched, not a separate permission-checked query).
  const sourceSalesOrders = Array.from(
    new Set(doc.locations.map((l) => l.sales_order).filter((v): v is string => Boolean(v))),
  );
  const [downstreamConnections, timeline, session] = await Promise.all([
    getConnections("Pick List", doc.name),
    buildTimeline("Pick List", doc.name, doc),
    verifySession((await cookies()).get(SESSION_COOKIE)?.value),
  ]);
  const connections: Connection[] = [
    { label: "Sales Order", href: "/sales/orders", docs: sourceSalesOrders },
    ...downstreamConnections,
  ];
  // Show "Create Delivery Note" whenever any line still has picked qty left to deliver —
  // `delivered_qty` is a real, live stored field on Pick List Item (same shape as Sales
  // Order Item's own delivered_qty), no live-summed query needed.
  const hasRemainingToDeliver = doc.locations.some((l) => l.picked_qty - (l.delivered_qty ?? 0) > 1e-6);
  const status = pickListStatus(doc);

  const header = (
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-medium text-graphite-900">{doc.name}</h1>
        <div className="mt-1 flex items-center gap-3">
          <StatusPill label={status.label} tone={status.tone} />
          <ProgressBar value={doc.per_delivered ?? 0} />
        </div>
      </div>
      {doc.docstatus === 0 && (
        <DocActionBar action={submitPickListAction.bind(null, doc.name)} label="Submit" pendingLabel="Submitting…" />
      )}
      {doc.docstatus === 1 && (
        <DocActionBar
          action={cancelPickListAction.bind(null, doc.name)}
          label="Cancel"
          pendingLabel="Cancelling…"
          variant="danger"
        />
      )}
    </div>
  );

  const connectionsTab = (
    <ConnectionsPanel
      connections={connections}
      createAction={
        doc.docstatus === 1 && hasRemainingToDeliver
          ? { label: "Create Delivery Note", href: `/sales/pick-lists/${encodeURIComponent(doc.name)}/create-delivery` }
          : undefined
      }
    />
  );

  const commentsTab = (
    <ActivityTimeline
      currentUserFullName={session?.fullName ?? ""}
      entries={timeline}
      postComment={postCommentAction.bind(null, "Pick List", doc.name, `/sales/pick-lists/${encodeURIComponent(doc.name)}`)}
    />
  );

  const detailsTab =
    doc.docstatus === 0 ? (
      <div>
        <dl className="mb-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <DocField label="Customer" value={doc.customer_name || doc.customer || "—"} />
          <DocField label="Company" value={doc.company} />
          <DocField label="Purpose" value={doc.purpose} />
        </dl>
        <PickListPickedQtyEditor
          action={updatePickListPickedQtyAction.bind(null, doc.name)}
          locations={doc.locations.map(
            (l): EditablePickListLocation => ({
              name: l.name,
              item_code: l.item_code,
              item_name: l.item_name,
              warehouse: l.warehouse,
              qty: l.qty,
              stock_qty: l.stock_qty,
              uom: l.uom,
              stock_uom: l.stock_uom,
              conversion_factor: l.conversion_factor,
              picked_qty: l.picked_qty,
              sales_order: l.sales_order,
              sales_order_item: l.sales_order_item,
            }),
          )}
        />
      </div>
    ) : (
      <div>
        <dl className="mb-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <DocField label="Customer" value={doc.customer_name || doc.customer || "—"} />
          <DocField label="Company" value={doc.company} />
          <DocField label="Purpose" value={doc.purpose} />
        </dl>
        <PickListLocationsTable locations={doc.locations} />
      </div>
    );

  return (
    <div>
      {breadcrumb}
      <SavedBanner show={saved === "1"} />
      {header}
      <DocTabs
        tabs={[
          { id: "details", label: "Details", content: detailsTab },
          { id: "connections", label: "Connections", content: connectionsTab },
          { id: "comments", label: "Comments", content: commentsTab },
        ]}
      />
    </div>
  );
}
