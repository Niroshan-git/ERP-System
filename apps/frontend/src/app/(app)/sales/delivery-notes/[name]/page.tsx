import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { AccessDeniedNotice } from "@/components/AccessDeniedNotice";
import { DeliveryNoteForm } from "@/components/DeliveryNoteForm";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { AddressContactFields } from "@/components/AddressContactFields";
import { TermsFields } from "@/components/TermsFields";
import { LineItemsTable, type LineItemRow } from "@/components/LineItemsTable";
import { DocActionBar } from "@/components/DocActionBar";
import { DocField } from "@/components/DocField";
import { StatusPill } from "@/components/StatusPill";
import { Breadcrumb } from "@/components/Breadcrumb";
import { DocTabs } from "@/components/DocTabs";
import { ConnectionsPanel } from "@/components/ConnectionsPanel";
import { SavedBanner } from "@/components/SavedBanner";
import { ErpNextError, getDoc, listDocs } from "@/lib/erpnext";
import { getSellingDefaults } from "@/lib/salesDefaults";
import { listItemOptions } from "@/lib/actions/itemLookup";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { getConnections, type Connection } from "@/lib/connections";
import { getRelationshipMap } from "@/lib/relationshipMap";
import type { DocStatus } from "@/lib/docStatus";
import { deliveryNoteStatus } from "@/lib/erpStatus";
import { buildTimeline } from "@/lib/timeline";
import { postCommentAction } from "@/lib/actions/comments";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { getInvoicedQtyByDnDetail } from "@/lib/fulfillment";
import { cancelDeliveryNoteAction, submitDeliveryNoteAction, updateDeliveryNoteAction } from "../actions";

type DeliveryNoteDoc = {
  name: string;
  customer: string;
  posting_date: string;
  company: string;
  currency: string;
  selling_price_list: string;
  grand_total: number;
  docstatus: DocStatus;
  status: string;
  per_billed: number;
  is_return?: 0 | 1;
  creation: string;
  owner: string;
  modified: string;
  modified_by: string;
  items: (LineItemRow & { name: string; against_sales_order?: string; warehouse?: string })[];
  customer_address?: string;
  contact_person?: string;
  shipping_address_name?: string;
  territory?: string;
  customer_group?: string;
  address_display?: string;
  contact_display?: string;
  tc_name?: string;
  terms?: string;
  title?: string;
  po_no?: string;
  po_date?: string;
};

export default async function DeliveryNoteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { name } = await params;
  const { saved } = await searchParams;

  let doc: DeliveryNoteDoc;
  try {
    doc = await getDoc<DeliveryNoteDoc>("Delivery Note", decodeURIComponent(name));
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    if (e instanceof ErpNextError && e.status === 403) {
      return (
        <div>
          <h1 className="mb-4 text-2xl font-medium text-graphite-900">{decodeURIComponent(name)}</h1>
          <AccessDeniedNotice what="this delivery note" />
        </div>
      );
    }
    throw e;
  }

  const breadcrumb = (
    <Breadcrumb
      items={[
        { label: "Home", href: "/" },
        { label: "Selling", href: "/sales/delivery-notes" },
        { label: "Delivery Note", href: "/sales/delivery-notes" },
        { label: doc.customer },
      ]}
    />
  );

  // Upstream reference (the Sales Order this delivery note was made from, if any) — read
  // directly off this doc's own items, same technique the Sales Order detail page already
  // uses for its own upstream Quotation reference (works even in Draft, since it's part of
  // the document we already fetched, not a separate permission-checked query).
  const sourceSalesOrders = Array.from(
    new Set(doc.items.map((item) => item.against_sales_order).filter((v): v is string => Boolean(v))),
  );
  const [downstreamConnections, timeline, session, invoicedByRef, relationshipMap] = await Promise.all([
    getConnections("Delivery Note", doc.name),
    buildTimeline("Delivery Note", doc.name, doc),
    verifySession((await cookies()).get(SESSION_COOKIE)?.value),
    getInvoicedQtyByDnDetail(doc.name),
    getRelationshipMap("Delivery Note", doc.name),
  ]);
  const connections: Connection[] = [
    { label: "Sales Order", href: "/sales/orders", docs: sourceSalesOrders },
    ...downstreamConnections,
  ];
  // Show "Create Sales Invoice" whenever any line still has qty left to invoice — same
  // multiple-partial-invoices shape as Sales Order's own create-invoice gate. See
  // lib/fulfillment.ts's getInvoicedQtyByDnDetail for why this is a live computed query,
  // not a stored field read (Delivery Note Item has no stored billed-qty field at all).
  const hasRemainingToInvoice = doc.items.some((item) => item.qty - (invoicedByRef[item.name] ?? 0) > 1e-6);
  // Same cancel-blocking rule as Sales Order/Quotation: ERPNext only refuses to cancel over
  // a *submitted* linked Sales Invoice. The server action re-checks this for real; this is
  // just so the user sees why up front instead of hitting a rejection after clicking Cancel.
  const blockingInvoices = connections.find((c) => c.label === "Sales Invoice")?.submittedDocs ?? [];
  const status = deliveryNoteStatus(doc);

  const header = (
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-medium text-graphite-900">{doc.name}</h1>
        <div className="mt-1">
          <StatusPill label={status.label} tone={status.tone} />
        </div>
      </div>
      {doc.docstatus === 0 && (
        <DocActionBar
          action={submitDeliveryNoteAction.bind(null, doc.name)}
          label="Submit"
          pendingLabel="Submitting…"
        />
      )}
      {doc.docstatus === 1 &&
        (blockingInvoices.length > 0 ? (
          <p className="text-sm text-alert">
            Cannot cancel — linked with Sales Invoice{" "}
            {blockingInvoices.map((invName, i) => (
              <span key={invName}>
                {i > 0 && ", "}
                <a href={`/sales/invoices/${encodeURIComponent(invName)}`} className="underline">
                  {invName}
                </a>
              </span>
            ))}
            . Cancel that first.
          </p>
        ) : (
          <DocActionBar
            action={cancelDeliveryNoteAction.bind(null, doc.name)}
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
          ? { label: "Create Sales Invoice", href: `/sales/delivery-notes/${encodeURIComponent(doc.name)}/create-invoice` }
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
        "Delivery Note",
        doc.name,
        `/sales/delivery-notes/${encodeURIComponent(doc.name)}`,
      )}
    />
  );

  let detailsTab: React.ReactNode;
  let addressContactTab: React.ReactNode;
  let termsTab: React.ReactNode;
  let moreInfoTab: React.ReactNode;

  if (doc.docstatus === 0) {
    const [defaults, itemOptions, customers, addresses, contacts, territories, customerGroups, paymentTermsTemplates, termsTemplates, itemFlags] =
      await Promise.all([
        getSellingDefaults(doc.company),
        listItemOptions(),
        fetchLinkOptions("Customer"),
        fetchLinkOptions("Address"),
        fetchLinkOptions("Contact"),
        fetchLinkOptions("Territory"),
        fetchLinkOptions("Customer Group"),
        fetchLinkOptions("Payment Terms Template"),
        fetchLinkOptions("Terms and Conditions"),
        // has_batch_no/has_serial_no are Item master flags, not Delivery Note Item fields —
        // fetched here so a Draft's already-saved lines still show the batch/serial picker
        // button on reload, not just right after picking an item client-side.
        listDocs<{ name: string; has_batch_no?: 0 | 1; has_serial_no?: 0 | 1 }>("Item", {
          fields: ["name", "has_batch_no", "has_serial_no"],
          filters: [["name", "in", Array.from(new Set(doc.items.map((i) => i.item_code)))]],
          limit: 500,
        }).catch(() => []),
      ]);
    const flagsByItem = Object.fromEntries(itemFlags.map((i) => [i.name, i]));

    detailsTab = (
      <DeliveryNoteForm
        action={updateDeliveryNoteAction.bind(null, doc.name)}
        itemOptions={itemOptions}
        customers={customers}
        companies={defaults.companies}
        currency={defaults.currency}
        sellingPriceList={defaults.sellingPriceList}
        defaultWarehouse={defaults.defaultWarehouse}
        initial={{
          customer: doc.customer,
          posting_date: doc.posting_date,
          company: doc.company,
          items: doc.items.map((i) => ({
            item_code: i.item_code,
            item_name: i.item_name,
            qty: i.qty,
            uom: i.uom,
            rate: i.rate,
            warehouse: i.warehouse,
            has_batch_no: Boolean(flagsByItem[i.item_code]?.has_batch_no),
            has_serial_no: Boolean(flagsByItem[i.item_code]?.has_serial_no),
            // Not re-populated here: an already-attached bundle's own entries aren't
            // fetched back into the picker on reload (out of scope for this pass — see the
            // Phase 2C report). Re-opening the picker for an already-bundled line would
            // start from a fresh FIFO suggestion, not the previously-confirmed selection.
          })),
        }}
      />
    );

    addressContactTab = (
      <AddressContactFields
        formId="delivery-note-form"
        addresses={addresses}
        contacts={contacts}
        territories={territories}
        customerGroups={customerGroups}
        initial={{
          customer_address: doc.customer_address,
          contact_person: doc.contact_person,
          shipping_address_name: doc.shipping_address_name,
          territory: doc.territory,
          customer_group: doc.customer_group,
        }}
      />
    );

    termsTab = (
      <TermsFields
        formId="delivery-note-form"
        paymentTermsTemplates={paymentTermsTemplates}
        termsTemplates={termsTemplates}
        initial={{
          tc_name: doc.tc_name,
          terms: doc.terms,
        }}
      />
    );

    moreInfoTab = (
      <div className="max-w-3xl space-y-4">
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium text-graphite-900">
            Title
          </label>
          <input
            id="title"
            name="title"
            form="delivery-note-form"
            defaultValue={doc.title}
            className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="po_no" className="mb-1 block text-sm font-medium text-graphite-900">
              Customer&apos;s Purchase Order
            </label>
            <input
              id="po_no"
              name="po_no"
              form="delivery-note-form"
              defaultValue={doc.po_no}
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
            />
          </div>
          <div>
            <label htmlFor="po_date" className="mb-1 block text-sm font-medium text-graphite-900">
              Customer&apos;s PO Date
            </label>
            <input
              type="date"
              id="po_date"
              name="po_date"
              form="delivery-note-form"
              defaultValue={doc.po_date}
              className="w-full rounded-md border border-border px-3 py-2 font-mono text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
            />
          </div>
        </div>
      </div>
    );
  } else {
    detailsTab = (
      <div>
        <dl className="mb-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <DocField label="Customer" value={doc.customer} />
          <DocField label="Posting date" value={doc.posting_date} mono />
          <DocField label="Company" value={doc.company} />
          <DocField label="Grand total" value={`${doc.grand_total.toFixed(2)} ${doc.currency}`} mono />
        </dl>
        <LineItemsTable items={doc.items} currency={doc.currency} />
      </div>
    );

    addressContactTab = (
      <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
        <DocField label="Customer address" value={doc.customer_address || "—"} />
        <DocField label="Contact person" value={doc.contact_person || "—"} />
        <DocField label="Shipping address" value={doc.shipping_address_name || "—"} />
        <DocField label="Territory" value={doc.territory || "—"} />
        <DocField label="Customer group" value={doc.customer_group || "—"} />
        <DocField label="Address display" value={doc.address_display || "—"} />
        <DocField label="Contact display" value={doc.contact_display || "—"} />
      </dl>
    );

    termsTab = (
      <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
        <DocField label="Terms and conditions template" value={doc.tc_name || "—"} />
        <DocField label="Terms" value={doc.terms || "—"} />
      </dl>
    );

    moreInfoTab = (
      <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
        <DocField label="Title" value={doc.title || "—"} />
        <DocField label="Customer's Purchase Order" value={doc.po_no || "—"} />
        <DocField label="Customer's PO Date" value={doc.po_date || "—"} mono />
      </dl>
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
          { id: "address-contact", label: "Address & Contact", content: addressContactTab },
          { id: "terms", label: "Terms", content: termsTab },
          { id: "more-info", label: "More Info", content: moreInfoTab },
          { id: "connections", label: "Connections", content: connectionsTab },
          { id: "comments", label: "Comments", content: commentsTab },
        ]}
      />
    </div>
  );
}
