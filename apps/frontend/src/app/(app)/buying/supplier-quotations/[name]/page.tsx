import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { LineItemsTable, type LineItemRow } from "@/components/LineItemsTable";
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
import { supplierQuotationStatus } from "@/lib/erpStatus";
import { buildTimeline } from "@/lib/timeline";
import { postCommentAction } from "@/lib/actions/comments";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { cancelSupplierQuotationAction, submitSupplierQuotationAction } from "../actions";

type SupplierQuotationDoc = {
  name: string;
  supplier: string;
  supplier_name?: string;
  company: string;
  status: string;
  docstatus: DocStatus;
  transaction_date: string;
  valid_till?: string;
  currency: string;
  conversion_rate: number;
  creation: string;
  owner: string;
  modified: string;
  modified_by: string;
  items: (LineItemRow & { name: string; request_for_quotation?: string })[];
};

export default async function SupplierQuotationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { name } = await params;
  const { saved } = await searchParams;

  let doc: SupplierQuotationDoc;
  try {
    doc = await getDoc<SupplierQuotationDoc>("Supplier Quotation", decodeURIComponent(name));
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  const breadcrumb = (
    <Breadcrumb
      items={[
        { label: "Home", href: "/" },
        { label: "Buying", href: "/buying/supplier-quotations" },
        { label: "Supplier Quotation", href: "/buying/supplier-quotations" },
        { label: doc.name },
      ]}
    />
  );

  const [connections, timeline, session, relationshipMap] = await Promise.all([
    getConnections("Supplier Quotation", doc.name),
    buildTimeline("Supplier Quotation", doc.name, doc),
    verifySession((await cookies()).get(SESSION_COOKIE)?.value),
    getBuyingRelationshipMap("Supplier Quotation", doc.name),
  ]);

  const status = supplierQuotationStatus(doc);
  const sourceRfq = doc.items.find((i) => i.request_for_quotation)?.request_for_quotation;

  const header = (
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-medium text-graphite-900">{doc.name}</h1>
        <div className="mt-1">
          <StatusPill label={status.label} tone={status.tone} />
        </div>
      </div>
      {doc.docstatus === 0 && (
        <DocActionBar action={submitSupplierQuotationAction.bind(null, doc.name)} label="Submit" pendingLabel="Submitting…" />
      )}
      {doc.docstatus === 1 && (
        <div className="flex items-center gap-3">
          <Link
            href={`/buying/supplier-quotations/${encodeURIComponent(doc.name)}/create-order`}
            className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90"
          >
            Create Purchase Order
          </Link>
          <DocActionBar
            action={cancelSupplierQuotationAction.bind(null, doc.name)}
            label="Cancel"
            pendingLabel="Cancelling…"
            variant="danger"
          />
        </div>
      )}
    </div>
  );

  const detailsTab = (
    <div>
      <dl className="mb-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
        <DocField label="Supplier" value={doc.supplier_name || doc.supplier} />
        <DocField label="Company" value={doc.company} />
        <DocField label="Date" value={doc.transaction_date} mono />
        <DocField label="Valid till" value={doc.valid_till || "—"} mono />
        <DocField label="Currency" value={doc.currency} mono />
        {sourceRfq && <DocField label="From RFQ" value={sourceRfq} mono />}
      </dl>
      <LineItemsTable items={doc.items} currency={doc.currency} />
    </div>
  );

  const connectionsTab = <ConnectionsPanel connections={connections} relationshipMap={relationshipMap} />;

  const commentsTab = (
    <ActivityTimeline
      currentUserFullName={session?.fullName ?? ""}
      entries={timeline}
      postComment={postCommentAction.bind(
        null,
        "Supplier Quotation",
        doc.name,
        `/buying/supplier-quotations/${encodeURIComponent(doc.name)}`,
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
          { id: "connections", label: "Connections", content: connectionsTab },
          { id: "comments", label: "Comments", content: commentsTab },
        ]}
      />
    </div>
  );
}
