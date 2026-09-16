import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { PurchaseInvoiceForm } from "@/components/PurchaseInvoiceForm";
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
import { getConnections } from "@/lib/connections";
import { getBuyingRelationshipMap } from "@/lib/buyingRelationshipMap";
import type { DocStatus } from "@/lib/docStatus";
import { purchaseInvoiceStatus } from "@/lib/erpStatus";
import { buildTimeline } from "@/lib/timeline";
import { postCommentAction } from "@/lib/actions/comments";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { formatAmount } from "@/lib/format";
import { cancelPurchaseInvoiceAction, submitPurchaseInvoiceAction, updatePurchaseInvoiceAction } from "../actions";

type PurchaseInvoiceDoc = {
  name: string;
  supplier: string;
  supplier_name?: string;
  posting_date: string;
  due_date?: string;
  bill_no?: string;
  bill_date?: string;
  company: string;
  currency: string;
  credit_to: string;
  grand_total: number;
  net_total: number;
  outstanding_amount: number;
  on_hold?: 0 | 1;
  release_date?: string;
  docstatus: DocStatus;
  status: string;
  creation: string;
  owner: string;
  modified: string;
  modified_by: string;
  items: (LineItemRow & { purchase_order?: string; purchase_receipt?: string })[];
};

export default async function PurchaseInvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { name } = await params;
  const { saved } = await searchParams;

  let doc: PurchaseInvoiceDoc;
  try {
    doc = await getDoc<PurchaseInvoiceDoc>("Purchase Invoice", decodeURIComponent(name));
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  const breadcrumb = (
    <Breadcrumb
      items={[
        { label: "Home", href: "/" },
        { label: "Buying", href: "/buying" },
        { label: "Purchase Invoice", href: "/buying/purchase-invoices" },
        { label: doc.name },
      ]}
    />
  );

  const status = purchaseInvoiceStatus(doc);

  const header = (
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-medium text-graphite-900">{doc.name}</h1>
        <div className="mt-1">
          <StatusPill label={status.label} tone={status.tone} />
        </div>
      </div>
      {doc.docstatus === 0 && (
        <DocActionBar action={submitPurchaseInvoiceAction.bind(null, doc.name)} label="Submit" pendingLabel="Submitting…" />
      )}
      {doc.docstatus === 1 && (
        <DocActionBar
          action={cancelPurchaseInvoiceAction.bind(null, doc.name)}
          label="Cancel"
          pendingLabel="Cancelling…"
          variant="danger"
        />
      )}
    </div>
  );

  // Upstream references (the Purchase Order and/or Purchase Receipt this invoice was made
  // from, if any) — read directly off this doc's own items, same technique the Sales side
  // already uses. A receipt-sourced invoice carries both fields on the same line (see
  // buildInvoiceItemFromPurchaseReceipt's carryover), so both can legitimately be present.
  const sourcePurchaseOrders = Array.from(
    new Set(doc.items.map((item) => item.purchase_order).filter((v): v is string => Boolean(v))),
  );
  const sourcePurchaseReceipts = Array.from(
    new Set(doc.items.map((item) => item.purchase_receipt).filter((v): v is string => Boolean(v))),
  );
  const [downstreamConnections, relationshipMap] = await Promise.all([
    getConnections("Purchase Invoice", doc.name),
    getBuyingRelationshipMap("Purchase Invoice", doc.name),
  ]);
  const connections = [
    { label: "Purchase Order", href: "/buying/purchase-orders", docs: sourcePurchaseOrders },
    { label: "Purchase Receipt", href: "/buying/purchase-receipts", docs: sourcePurchaseReceipts },
    ...downstreamConnections,
  ];
  const connectionsTab = <ConnectionsPanel connections={connections} relationshipMap={relationshipMap} />;

  const [timeline, session] = await Promise.all([
    buildTimeline("Purchase Invoice", doc.name, doc),
    verifySession((await cookies()).get(SESSION_COOKIE)?.value),
  ]);

  const commentsTab = (
    <ActivityTimeline
      currentUserFullName={session?.fullName ?? ""}
      entries={timeline}
      postComment={postCommentAction.bind(
        null,
        "Purchase Invoice",
        doc.name,
        `/buying/purchase-invoices/${encodeURIComponent(doc.name)}`,
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
      <PurchaseInvoiceForm
        action={updatePurchaseInvoiceAction.bind(null, doc.name)}
        itemOptions={itemOptions}
        suppliers={suppliers ?? [doc.supplier]}
        companies={defaults.companies}
        currency={defaults.currency}
        payableAccount={defaults.defaultPayableAccount}
        initial={{
          supplier: doc.supplier,
          posting_date: doc.posting_date,
          due_date: doc.due_date,
          bill_no: doc.bill_no,
          bill_date: doc.bill_date,
          company: doc.company,
          items: doc.items.map((i) => ({
            item_code: i.item_code,
            item_name: i.item_name,
            qty: i.qty,
            uom: i.uom,
            rate: i.rate,
          })),
        }}
      />
    );
  } else {
    detailsTab = (
      <div>
        <dl className="mb-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <DocField label="Supplier" value={doc.supplier_name || doc.supplier} />
          <DocField label="Posting date" value={doc.posting_date} mono />
          <DocField label="Due date" value={doc.due_date || "—"} mono />
          <DocField label="Supplier invoice no." value={doc.bill_no || "—"} />
          <DocField label="Company" value={doc.company} />
          <DocField label="Payable account" value={doc.credit_to} mono />
          <DocField label="Net total" value={`${formatAmount(doc.net_total)} ${doc.currency}`} mono />
          <DocField label="Grand total" value={`${formatAmount(doc.grand_total)} ${doc.currency}`} mono />
          <DocField label="Outstanding" value={`${formatAmount(doc.outstanding_amount)} ${doc.currency}`} mono />
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
