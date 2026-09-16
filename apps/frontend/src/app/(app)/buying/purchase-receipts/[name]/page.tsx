import { notFound } from "next/navigation";
import { cookies } from "next/headers";
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
import { purchaseReceiptStatus } from "@/lib/erpStatus";
import { buildTimeline } from "@/lib/timeline";
import { postCommentAction } from "@/lib/actions/comments";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { getBilledQtyByPrDetail } from "@/lib/fulfillment";
import { formatAmount } from "@/lib/format";
import { cancelPurchaseReceiptAction, submitPurchaseReceiptAction } from "../actions";

type PurchaseReceiptDoc = {
  name: string;
  supplier: string;
  supplier_name?: string;
  posting_date: string;
  company: string;
  currency: string;
  grand_total: number;
  docstatus: DocStatus;
  status: string;
  per_billed: number;
  per_returned: number;
  is_return?: 0 | 1;
  creation: string;
  owner: string;
  modified: string;
  modified_by: string;
  items: (LineItemRow & { name: string; purchase_order?: string; warehouse?: string })[];
};

/**
 * Purchase Receipt has no standalone `new/` and no edit form in this build — per the plan's
 * own instruction, `actions.ts` only exposes submit/cancel (plus the create-from-Purchase-
 * Order action, invoked from the Purchase Order detail page). A Draft receipt is shown
 * read-only here, same info shape as a Submitted one — editing a Draft's lines isn't part
 * of this build's scope.
 */
export default async function PurchaseReceiptDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { name } = await params;
  const { saved } = await searchParams;

  let doc: PurchaseReceiptDoc;
  try {
    doc = await getDoc<PurchaseReceiptDoc>("Purchase Receipt", decodeURIComponent(name));
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  const breadcrumb = (
    <Breadcrumb
      items={[
        { label: "Home", href: "/" },
        { label: "Buying", href: "/buying" },
        { label: "Purchase Receipt", href: "/buying/purchase-receipts" },
        { label: doc.name },
      ]}
    />
  );

  // Upstream reference (the Purchase Order this receipt was made from, if any) — read
  // directly off this doc's own items, same technique the Sales side already uses for its
  // own upstream references (works even in Draft, since it's part of the document we
  // already fetched, not a separate permission-checked query).
  const sourcePurchaseOrders = Array.from(
    new Set(doc.items.map((item) => item.purchase_order).filter((v): v is string => Boolean(v))),
  );
  const [downstreamConnections, timeline, session, billedByRef, relationshipMap] = await Promise.all([
    getConnections("Purchase Receipt", doc.name),
    buildTimeline("Purchase Receipt", doc.name, doc),
    verifySession((await cookies()).get(SESSION_COOKIE)?.value),
    getBilledQtyByPrDetail(doc.name),
    getBuyingRelationshipMap("Purchase Receipt", doc.name),
  ]);
  const connections = [
    { label: "Purchase Order", href: "/buying/purchase-orders", docs: sourcePurchaseOrders },
    ...downstreamConnections,
  ];
  const hasRemainingToInvoice = doc.items.some((item) => item.qty - (billedByRef[item.name] ?? 0) > 1e-6);
  const blockingInvoices = connections.find((c) => c.label === "Purchase Invoice")?.submittedDocs ?? [];
  const status = purchaseReceiptStatus(doc);

  const header = (
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-medium text-graphite-900">{doc.name}</h1>
        <div className="mt-1">
          <StatusPill label={status.label} tone={status.tone} />
        </div>
      </div>
      {doc.docstatus === 0 && (
        <DocActionBar action={submitPurchaseReceiptAction.bind(null, doc.name)} label="Submit" pendingLabel="Submitting…" />
      )}
      {doc.docstatus === 1 &&
        (blockingInvoices.length > 0 ? (
          <p className="text-sm text-alert">
            Cannot cancel — linked with Purchase Invoice{" "}
            {blockingInvoices.map((invName, i) => (
              <span key={invName}>
                {i > 0 && ", "}
                <a href={`/buying/purchase-invoices/${encodeURIComponent(invName)}`} className="underline">
                  {invName}
                </a>
              </span>
            ))}
            . Cancel that first.
          </p>
        ) : (
          <DocActionBar
            action={cancelPurchaseReceiptAction.bind(null, doc.name)}
            label="Cancel"
            pendingLabel="Cancelling…"
            variant="danger"
          />
        ))}
    </div>
  );

  const connectionsTab = (
    <ConnectionsPanel
      connections={connections}
      createAction={
        doc.docstatus === 1 && hasRemainingToInvoice
          ? { label: "Create Purchase Invoice", href: `/buying/purchase-receipts/${encodeURIComponent(doc.name)}/create-invoice` }
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
        "Purchase Receipt",
        doc.name,
        `/buying/purchase-receipts/${encodeURIComponent(doc.name)}`,
      )}
    />
  );

  const detailsTab = (
    <div>
      <dl className="mb-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
        <DocField label="Supplier" value={doc.supplier_name || doc.supplier} />
        <DocField label="Posting date" value={doc.posting_date} mono />
        <DocField label="Company" value={doc.company} />
        <DocField label="% Billed" value={`${(doc.per_billed ?? 0).toFixed(0)}%`} mono />
        <DocField label="Grand total" value={`${formatAmount(doc.grand_total)} ${doc.currency}`} mono />
      </dl>
      <LineItemsTable items={doc.items} currency={doc.currency} />
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
