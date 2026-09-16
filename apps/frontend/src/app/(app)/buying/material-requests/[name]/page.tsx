import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { MaterialRequestForm } from "@/components/MaterialRequestForm";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { PlainLineItemsTable, type PlainLineItemRow } from "@/components/PlainLineItemsTable";
import { DocActionBar } from "@/components/DocActionBar";
import { DocField } from "@/components/DocField";
import { StatusPill } from "@/components/StatusPill";
import { Breadcrumb } from "@/components/Breadcrumb";
import { DocTabs } from "@/components/DocTabs";
import { ConnectionsPanel } from "@/components/ConnectionsPanel";
import { SavedBanner } from "@/components/SavedBanner";
import { ErpNextError, getDoc } from "@/lib/erpnext";
import { listItemOptions } from "@/lib/actions/itemLookup";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { getConnections } from "@/lib/connections";
import { getBuyingRelationshipMap } from "@/lib/buyingRelationshipMap";
import type { DocStatus } from "@/lib/docStatus";
import { materialRequestStatus } from "@/lib/erpStatus";
import { buildTimeline } from "@/lib/timeline";
import { postCommentAction } from "@/lib/actions/comments";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { cancelMaterialRequestAction, submitMaterialRequestAction, updateMaterialRequestAction } from "../actions";

type MaterialRequestDoc = {
  name: string;
  company: string;
  transaction_date: string;
  schedule_date?: string;
  status: string;
  docstatus: DocStatus;
  per_ordered: number;
  per_received: number;
  creation: string;
  owner: string;
  modified: string;
  modified_by: string;
  items: {
    name: string;
    item_code: string;
    item_name: string;
    schedule_date: string;
    qty: number;
    uom: string;
    ordered_qty?: number;
    received_qty?: number;
  }[];
};

export default async function MaterialRequestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { name } = await params;
  const { saved } = await searchParams;

  let doc: MaterialRequestDoc;
  try {
    doc = await getDoc<MaterialRequestDoc>("Material Request", decodeURIComponent(name));
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  const breadcrumb = (
    <Breadcrumb
      items={[
        { label: "Home", href: "/" },
        { label: "Buying", href: "/buying" },
        { label: "Material Request", href: "/buying/material-requests" },
        { label: doc.name },
      ]}
    />
  );

  const [connections, timeline, session, relationshipMap] = await Promise.all([
    getConnections("Material Request", doc.name),
    buildTimeline("Material Request", doc.name, doc),
    verifySession((await cookies()).get(SESSION_COOKIE)?.value),
    getBuyingRelationshipMap("Material Request", doc.name),
  ]);

  const status = materialRequestStatus(doc);

  const header = (
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-medium text-graphite-900">{doc.name}</h1>
        <div className="mt-1">
          <StatusPill label={status.label} tone={status.tone} />
        </div>
      </div>
      {doc.docstatus === 0 && (
        <DocActionBar action={submitMaterialRequestAction.bind(null, doc.name)} label="Submit" pendingLabel="Submitting…" />
      )}
      {doc.docstatus === 1 && (
        <DocActionBar
          action={cancelMaterialRequestAction.bind(null, doc.name)}
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
        doc.docstatus === 1
          ? { label: "Create RFQ", href: `/buying/material-requests/${encodeURIComponent(doc.name)}/create-rfq` }
          : undefined
      }
      relationshipMap={relationshipMap}
    />
  );

  const commentsTab = (
    <ActivityTimeline
      currentUserFullName={session?.fullName ?? ""}
      entries={timeline}
      postComment={postCommentAction.bind(
        null,
        "Material Request",
        doc.name,
        `/buying/material-requests/${encodeURIComponent(doc.name)}`,
      )}
    />
  );

  let detailsTab: React.ReactNode;

  if (doc.docstatus === 0) {
    const [itemOptions, companies] = await Promise.all([listItemOptions(), fetchLinkOptions("Company")]);

    detailsTab = (
      <MaterialRequestForm
        action={updateMaterialRequestAction.bind(null, doc.name)}
        itemOptions={itemOptions}
        companies={companies ?? [doc.company]}
        initial={{
          company: doc.company,
          transaction_date: doc.transaction_date,
          schedule_date: doc.schedule_date,
          items: doc.items.map((i) => ({
            item_code: i.item_code,
            item_name: i.item_name,
            qty: i.qty,
            uom: i.uom,
            rate: 0,
            schedule_date: i.schedule_date,
          })),
        }}
      />
    );
  } else {
    const itemRows: PlainLineItemRow[] = doc.items.map((i) => ({
      item_code: i.item_code,
      item_name: i.item_name,
      qty: i.qty,
      uom: i.uom,
      schedule_date: i.schedule_date,
      extra: [
        { label: "Ordered", value: String(i.ordered_qty ?? 0) },
        { label: "Received", value: String(i.received_qty ?? 0) },
      ],
    }));

    detailsTab = (
      <div>
        <dl className="mb-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <DocField label="Company" value={doc.company} />
          <DocField label="Date" value={doc.transaction_date} mono />
          <DocField label="Required by" value={doc.schedule_date || "—"} mono />
          <DocField label="% Ordered" value={`${(doc.per_ordered ?? 0).toFixed(0)}%`} mono />
          <DocField label="% Received" value={`${(doc.per_received ?? 0).toFixed(0)}%`} mono />
        </dl>
        <PlainLineItemsTable items={itemRows} />
      </div>
    );
  }

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
