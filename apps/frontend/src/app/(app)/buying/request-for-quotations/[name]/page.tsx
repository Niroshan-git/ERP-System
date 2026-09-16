import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
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
import { getConnections } from "@/lib/connections";
import { getBuyingRelationshipMap } from "@/lib/buyingRelationshipMap";
import type { DocStatus } from "@/lib/docStatus";
import { rfqStatus } from "@/lib/erpStatus";
import { buildTimeline } from "@/lib/timeline";
import { postCommentAction } from "@/lib/actions/comments";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { cancelRfqAction, submitRfqAction } from "../actions";

type RfqDoc = {
  name: string;
  company: string;
  transaction_date: string;
  schedule_date?: string;
  docstatus: DocStatus;
  creation: string;
  owner: string;
  modified: string;
  modified_by: string;
  suppliers: { name: string; supplier: string }[];
  items: {
    name: string;
    item_code: string;
    item_name: string;
    schedule_date: string;
    qty: number;
    uom: string;
    material_request?: string;
  }[];
};

export default async function RfqDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { name } = await params;
  const { saved } = await searchParams;

  let doc: RfqDoc;
  try {
    doc = await getDoc<RfqDoc>("Request for Quotation", decodeURIComponent(name));
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  const breadcrumb = (
    <Breadcrumb
      items={[
        { label: "Home", href: "/" },
        { label: "Buying", href: "/buying/request-for-quotations" },
        { label: "Request for Quotation", href: "/buying/request-for-quotations" },
        { label: doc.name },
      ]}
    />
  );

  const [connections, timeline, session, relationshipMap] = await Promise.all([
    getConnections("Request for Quotation", doc.name),
    buildTimeline("Request for Quotation", doc.name, doc),
    verifySession((await cookies()).get(SESSION_COOKIE)?.value),
    getBuyingRelationshipMap("Request for Quotation", doc.name),
  ]);

  const status = rfqStatus(doc);
  const sourceMaterialRequest = doc.items.find((i) => i.material_request)?.material_request;

  const header = (
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-medium text-graphite-900">{doc.name}</h1>
        <div className="mt-1">
          <StatusPill label={status.label} tone={status.tone} />
        </div>
      </div>
      {doc.docstatus === 0 && (
        <DocActionBar action={submitRfqAction.bind(null, doc.name)} label="Submit" pendingLabel="Submitting…" />
      )}
      {doc.docstatus === 1 && (
        <div className="flex items-center gap-3">
          <Link
            href={`/buying/request-for-quotations/${encodeURIComponent(doc.name)}/create-supplier-quotation`}
            className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90"
          >
            Record Supplier Quotation
          </Link>
          <DocActionBar
            action={cancelRfqAction.bind(null, doc.name)}
            label="Cancel"
            pendingLabel="Cancelling…"
            variant="danger"
          />
        </div>
      )}
    </div>
  );

  const itemRows: PlainLineItemRow[] = doc.items.map((i) => ({
    item_code: i.item_code,
    item_name: i.item_name,
    qty: i.qty,
    uom: i.uom,
    schedule_date: i.schedule_date,
  }));

  const detailsTab = (
    <div>
      <dl className="mb-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
        <DocField label="Company" value={doc.company} />
        <DocField label="Date" value={doc.transaction_date} mono />
        <DocField label="Required date" value={doc.schedule_date || "—"} mono />
        {sourceMaterialRequest && (
          <DocField label="From Material Request" value={sourceMaterialRequest} mono />
        )}
      </dl>
      <PlainLineItemsTable items={itemRows} />
    </div>
  );

  const suppliersTab = (
    <ul className="max-w-md space-y-1">
      {doc.suppliers.map((s) => (
        <li key={s.name} className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-graphite-900">
          {s.supplier}
        </li>
      ))}
      {doc.suppliers.length === 0 && <p className="text-sm text-graphite-500">No suppliers on this RFQ.</p>}
    </ul>
  );

  const connectionsTab = <ConnectionsPanel connections={connections} relationshipMap={relationshipMap} />;

  const commentsTab = (
    <ActivityTimeline
      currentUserFullName={session?.fullName ?? ""}
      entries={timeline}
      postComment={postCommentAction.bind(
        null,
        "Request for Quotation",
        doc.name,
        `/buying/request-for-quotations/${encodeURIComponent(doc.name)}`,
      )}
    />
  );

  return (
    <div>
      {breadcrumb}
      <SavedBanner show={saved === "1"} />
      {header}
      <DocTabs
        tabs={[
          { id: "details", label: "Details", content: detailsTab },
          { id: "suppliers", label: "Suppliers", content: suppliersTab },
          { id: "connections", label: "Connections", content: connectionsTab },
          { id: "comments", label: "Comments", content: commentsTab },
        ]}
      />
    </div>
  );
}
