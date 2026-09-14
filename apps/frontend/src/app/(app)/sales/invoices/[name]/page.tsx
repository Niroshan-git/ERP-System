import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { AccessDeniedNotice } from "@/components/AccessDeniedNotice";
import { SalesInvoiceForm } from "@/components/SalesInvoiceForm";
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
import { ErpNextError, getDoc } from "@/lib/erpnext";
import { getSellingDefaults } from "@/lib/salesDefaults";
import { listItemOptions } from "@/lib/actions/itemLookup";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { getConnections, type Connection } from "@/lib/connections";
import type { DocStatus } from "@/lib/docStatus";
import { salesInvoiceStatus } from "@/lib/erpStatus";
import { buildTimeline } from "@/lib/timeline";
import { postCommentAction } from "@/lib/actions/comments";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { cancelSalesInvoiceAction, submitSalesInvoiceAction, updateSalesInvoiceAction } from "../actions";

type SalesInvoiceDoc = {
  name: string;
  customer: string;
  posting_date: string;
  company: string;
  currency: string;
  selling_price_list: string;
  debit_to: string;
  grand_total: number;
  outstanding_amount: number;
  docstatus: DocStatus;
  status: string;
  creation: string;
  owner: string;
  modified: string;
  modified_by: string;
  items: (LineItemRow & { sales_order?: string; delivery_note?: string })[];
  customer_address?: string;
  contact_person?: string;
  shipping_address_name?: string;
  territory?: string;
  customer_group?: string;
  address_display?: string;
  contact_display?: string;
  payment_terms_template?: string;
  tc_name?: string;
  terms?: string;
  title?: string;
  po_no?: string;
  po_date?: string;
};

export default async function SalesInvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { name } = await params;
  const { saved } = await searchParams;

  let doc: SalesInvoiceDoc;
  try {
    doc = await getDoc<SalesInvoiceDoc>("Sales Invoice", decodeURIComponent(name));
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    if (e instanceof ErpNextError && e.status === 403) {
      return (
        <div>
          <h1 className="mb-4 text-2xl font-medium text-graphite-900">{decodeURIComponent(name)}</h1>
          <AccessDeniedNotice what="this sales invoice" />
        </div>
      );
    }
    throw e;
  }

  const breadcrumb = (
    <Breadcrumb
      items={[
        { label: "Home", href: "/" },
        { label: "Selling", href: "/sales/invoices" },
        { label: "Sales Invoice", href: "/sales/invoices" },
        { label: doc.customer },
      ]}
    />
  );

  const status = salesInvoiceStatus(doc);

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
          action={submitSalesInvoiceAction.bind(null, doc.name)}
          label="Submit"
          pendingLabel="Submitting…"
        />
      )}
      {doc.docstatus === 1 && (
        <DocActionBar
          action={cancelSalesInvoiceAction.bind(null, doc.name)}
          label="Cancel"
          pendingLabel="Cancelling…"
          variant="danger"
        />
      )}
    </div>
  );

  // Upstream references (the Sales Order and/or Delivery Note this invoice was made from,
  // if any) — read directly off this doc's own items, matching ERPNext's own dashboard
  // config (sales_invoice_dashboard.py: `"internal_links": {"Sales Order": ["items",
  // "sales_order"], "Delivery Note": ["items", "delivery_note"]}`). An invoice billed off a
  // Delivery Note carries both fields on the same line (delivery-notes/actions.ts's
  // buildInvoiceItemFromDeliveryNote sets `sales_order`/`so_detail` through too, when the
  // source Delivery Note line has them), so both can legitimately be present at once.
  const sourceSalesOrders = Array.from(
    new Set(doc.items.map((item) => item.sales_order).filter((v): v is string => Boolean(v))),
  );
  const sourceDeliveryNotes = Array.from(
    new Set(doc.items.map((item) => item.delivery_note).filter((v): v is string => Boolean(v))),
  );
  const [downstreamConnections, timeline, session] = await Promise.all([
    getConnections("Sales Invoice", doc.name),
    buildTimeline("Sales Invoice", doc.name, doc),
    verifySession((await cookies()).get(SESSION_COOKIE)?.value),
  ]);
  const connections: Connection[] = [
    { label: "Sales Order", href: "/sales/orders", docs: sourceSalesOrders },
    { label: "Delivery Note", href: "/sales/delivery-notes", docs: sourceDeliveryNotes },
    ...downstreamConnections,
  ];
  const connectionsTab = <ConnectionsPanel connections={connections} />;
  const commentsTab = (
    <ActivityTimeline
      currentUserFullName={session?.fullName ?? ""}
      entries={timeline}
      postComment={postCommentAction.bind(null, "Sales Invoice", doc.name, `/sales/invoices/${encodeURIComponent(doc.name)}`)}
    />
  );

  let detailsTab: React.ReactNode;
  let addressContactTab: React.ReactNode;
  let termsTab: React.ReactNode;
  let moreInfoTab: React.ReactNode;

  if (doc.docstatus === 0) {
    const [defaults, itemOptions, customers, addresses, contacts, territories, customerGroups, paymentTermsTemplates, termsTemplates] =
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
      ]);

    detailsTab = (
      <SalesInvoiceForm
        action={updateSalesInvoiceAction.bind(null, doc.name)}
        itemOptions={itemOptions}
        customers={customers}
        companies={defaults.companies}
        currency={defaults.currency}
        sellingPriceList={defaults.sellingPriceList}
        debitToAccount={defaults.debitToAccount}
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
          })),
        }}
      />
    );

    addressContactTab = (
      <AddressContactFields
        formId="sales-invoice-form"
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
        formId="sales-invoice-form"
        paymentTermsTemplates={paymentTermsTemplates}
        termsTemplates={termsTemplates}
        initial={{
          payment_terms_template: doc.payment_terms_template,
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
            form="sales-invoice-form"
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
              form="sales-invoice-form"
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
              form="sales-invoice-form"
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
          <DocField label="Receivable account" value={doc.debit_to} mono />
          <DocField label="Grand total" value={`${doc.grand_total.toFixed(2)} ${doc.currency}`} mono />
          <DocField label="Outstanding" value={`${doc.outstanding_amount.toFixed(2)} ${doc.currency}`} mono />
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
        <DocField label="Payment terms template" value={doc.payment_terms_template || "—"} />
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
