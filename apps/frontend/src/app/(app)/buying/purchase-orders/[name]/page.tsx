import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { PurchaseOrderForm } from "@/components/PurchaseOrderForm";
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
import { getBuyingDefaults } from "@/lib/buyingDefaults";
import { listItemOptions } from "@/lib/actions/itemLookup";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { getConnections, type Connection } from "@/lib/connections";
import { getBuyingRelationshipMap } from "@/lib/buyingRelationshipMap";
import type { DocStatus } from "@/lib/docStatus";
import { purchaseOrderStatus } from "@/lib/erpStatus";
import { buildTimeline } from "@/lib/timeline";
import { postCommentAction } from "@/lib/actions/comments";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { getBilledQtyByPoDetail } from "@/lib/fulfillment";
import { formatAmount } from "@/lib/format";
import { cancelPurchaseOrderAction, submitPurchaseOrderAction, updatePurchaseOrderAction } from "../actions";

type PurchaseOrderDoc = {
  name: string;
  supplier: string;
  supplier_name?: string;
  transaction_date: string;
  schedule_date?: string;
  company: string;
  currency: string;
  grand_total: number;
  net_total: number;
  docstatus: DocStatus;
  status: string;
  per_billed: number;
  per_received: number;
  creation: string;
  owner: string;
  modified: string;
  modified_by: string;
  items: (LineItemRow & {
    name: string;
    schedule_date?: string;
    /** Real, live stored Float field (per the live-verified field list this build was
     * scoped against) — "remaining to receive" is a simple subtraction, no live-summed
     * query needed, same shape as Sales Order Item's own `delivered_qty`. */
    received_qty?: number;
    /** Real, stored Purchase Order Item fields (see purchase-orders/actions.ts's
     * parsePurchaseOrderItems) — set only on a PO created via
     * createPurchaseOrderFromSupplierQuotationAction. Round-tripped through the edit form
     * below the same way Sales Order's own quotation_item/prevdoc_docname is (see that
     * page's own doc comment) — otherwise re-saving a Draft that came from the Supplier
     * Quotation create-order flow would silently drop its real ERPNext linkage back to the
     * source quotation the moment it's edited once. */
    supplier_quotation?: string;
    supplier_quotation_item?: string;
  })[];
};

export default async function PurchaseOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { name } = await params;
  const { saved } = await searchParams;

  let doc: PurchaseOrderDoc;
  try {
    doc = await getDoc<PurchaseOrderDoc>("Purchase Order", decodeURIComponent(name));
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  const breadcrumb = (
    <Breadcrumb
      items={[
        { label: "Home", href: "/" },
        { label: "Buying", href: "/buying" },
        { label: "Purchase Order", href: "/buying/purchase-orders" },
        { label: doc.name },
      ]}
    />
  );

  const [downstreamConnections, timeline, session, billedByRef, relationshipMap] = await Promise.all([
    getConnections("Purchase Order", doc.name),
    buildTimeline("Purchase Order", doc.name, doc),
    verifySession((await cookies()).get(SESSION_COOKIE)?.value),
    getBilledQtyByPoDetail(doc.name),
    getBuyingRelationshipMap("Purchase Order", doc.name),
  ]);
  const connections: Connection[] = downstreamConnections;

  // Show "Create Purchase Receipt" whenever any line still has qty left to receive —
  // `received_qty` is a real, live stored field (see the type comment above), same shape
  // as Sales Order's own hasRemainingToDeliver.
  const hasRemainingToReceive = doc.items.some((item) => item.qty - (item.received_qty ?? 0) > 1e-6);
  // Show "Create Purchase Invoice" whenever any line still has qty left to bill — Purchase
  // Order Item has no stored billed-*qty* field (only `billed_amt`, a Currency amount — see
  // lib/fulfillment.ts's getBilledQtyByPoDetail doc comment), so this is a live-summed query,
  // same shape as Sales Order's own hasRemainingToInvoice.
  const hasRemainingToInvoice = doc.items.some((item) => item.qty - (billedByRef[item.name] ?? 0) > 1e-6);
  // Same cancel-blocking pattern as Sales Order — ERPNext only refuses to cancel over a
  // *submitted* linked document. The server action re-checks this for real; this just shows
  // the user why up front.
  const blockingReceipts = connections.find((c) => c.label === "Purchase Receipt")?.submittedDocs ?? [];
  const blockingInvoices = connections.find((c) => c.label === "Purchase Invoice")?.submittedDocs ?? [];
  const blocking = [...blockingReceipts, ...blockingInvoices];
  const status = purchaseOrderStatus(doc);

  const header = (
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-medium text-graphite-900">{doc.name}</h1>
        <div className="mt-1">
          <StatusPill label={status.label} tone={status.tone} />
        </div>
      </div>
      {doc.docstatus === 0 && (
        <DocActionBar action={submitPurchaseOrderAction.bind(null, doc.name)} label="Submit" pendingLabel="Submitting…" />
      )}
      {doc.docstatus === 1 &&
        (blocking.length > 0 ? (
          <p className="text-sm text-alert">
            Cannot cancel — linked with {blocking.join(", ")}. Cancel those first.
          </p>
        ) : (
          <DocActionBar
            action={cancelPurchaseOrderAction.bind(null, doc.name)}
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
      createActions={[
        ...(doc.docstatus === 1 && hasRemainingToReceive
          ? [{ label: "Create Purchase Receipt", href: `/buying/purchase-orders/${encodeURIComponent(doc.name)}/create-receipt` }]
          : []),
        ...(doc.docstatus === 1 && hasRemainingToInvoice
          ? [{ label: "Create Purchase Invoice", href: `/buying/purchase-orders/${encodeURIComponent(doc.name)}/create-invoice` }]
          : []),
      ]}
      relationshipMap={relationshipMap}
    />
  );

  const commentsTab = (
    <ActivityTimeline
      currentUserFullName={session?.fullName ?? ""}
      entries={timeline}
      postComment={postCommentAction.bind(
        null,
        "Purchase Order",
        doc.name,
        `/buying/purchase-orders/${encodeURIComponent(doc.name)}`,
      )}
    />
  );

  let detailsTab: React.ReactNode;

  if (doc.docstatus === 0) {
    const [defaults, itemOptions, suppliers] = await Promise.all([
      getBuyingDefaults(doc.company),
      listItemOptions(),
      fetchLinkOptions("Supplier"),
    ]);

    detailsTab = (
      <PurchaseOrderForm
        action={updatePurchaseOrderAction.bind(null, doc.name)}
        itemOptions={itemOptions}
        suppliers={suppliers ?? [doc.supplier]}
        companies={defaults.companies}
        currency={defaults.currency}
        initial={{
          supplier: doc.supplier,
          transaction_date: doc.transaction_date,
          schedule_date: doc.schedule_date,
          company: doc.company,
          items: doc.items.map((i) => ({
            item_code: i.item_code,
            item_name: i.item_name,
            qty: i.qty,
            uom: i.uom,
            rate: i.rate,
            schedule_date: i.schedule_date,
            ...(i.supplier_quotation_item && i.supplier_quotation
              ? { supplier_quotation_item: i.supplier_quotation_item, source_supplier_quotation: i.supplier_quotation }
              : {}),
          })),
        }}
      />
    );
  } else {
    detailsTab = (
      <div>
        <dl className="mb-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <DocField label="Supplier" value={doc.supplier_name || doc.supplier} />
          <DocField label="Date" value={doc.transaction_date} mono />
          <DocField label="Required by" value={doc.schedule_date || "—"} mono />
          <DocField label="Company" value={doc.company} />
          <DocField label="% Received" value={`${(doc.per_received ?? 0).toFixed(0)}%`} mono />
          <DocField label="% Billed" value={`${(doc.per_billed ?? 0).toFixed(0)}%`} mono />
          <DocField label="Net total" value={`${formatAmount(doc.net_total)} ${doc.currency}`} mono />
          <DocField label="Grand total" value={`${formatAmount(doc.grand_total)} ${doc.currency}`} mono />
        </dl>
        <LineItemsTable items={doc.items} currency={doc.currency} />
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
