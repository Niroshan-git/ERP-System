import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { SalesOrderForm } from "@/components/SalesOrderForm";
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
import { toAppError } from "@/lib/appError";
import { InlineErrorState } from "@/components/ErrorState";
import { getSellingDefaults } from "@/lib/salesDefaults";
import { listItemOptions } from "@/lib/actions/itemLookup";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { getConnections, type Connection } from "@/lib/connections";
import { getRelationshipMap } from "@/lib/relationshipMap";
import type { DocStatus } from "@/lib/docStatus";
import { salesOrderStatus } from "@/lib/erpStatus";
import { buildTimeline } from "@/lib/timeline";
import { postCommentAction } from "@/lib/actions/comments";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { getBilledQtyBySoDetail } from "@/lib/fulfillment";
import { formatAmount } from "@/lib/format";
import { cancelSalesOrderAction, submitSalesOrderAction, updateSalesOrderAction } from "../actions";

type SalesOrderDoc = {
  name: string;
  customer: string;
  transaction_date: string;
  delivery_date?: string;
  order_type: string;
  company: string;
  currency: string;
  selling_price_list: string;
  grand_total: number;
  net_total: number;
  apply_discount_on?: string;
  additional_discount_percentage?: number;
  discount_amount?: number;
  docstatus: DocStatus;
  status: string;
  per_delivered: number;
  per_billed: number;
  creation: string;
  owner: string;
  modified: string;
  modified_by: string;
  items: (LineItemRow & {
    name: string;
    prevdoc_docname?: string;
    quotation_item?: string;
    /** Real, live stored Float field (confirmed via the live DocType JSON) — see the
     * hasRemainingToDeliver comment below. */
    delivered_qty?: number;
    /** Real, live stored Float field (confirmed via the live DocType JSON) — see the
     * hasRemainingToPick comment below. */
    picked_qty?: number;
    price_list_rate?: number;
    discount_percentage?: number;
    discount_amount?: number;
    pricing_rules?: string;
  })[];
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

export default async function SalesOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { name } = await params;
  const { saved } = await searchParams;

  let doc: SalesOrderDoc;
  try {
    doc = await getDoc<SalesOrderDoc>("Sales Order", decodeURIComponent(name));
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    // V1-HARDEN-1 demonstration of the documented inline-classification pattern
    // (docs/architecture/runtime-resilience.md "Adoption pattern"): a 403 is an *expected*,
    // classifiable condition — same tier as the pre-existing 404→notFound() branch above —
    // so it renders a safe, differentiated state here instead of falling through to the
    // generic sales/error.tsx boundary. Every other failure (ERPNext down, 500s, network)
    // still rethrows unchanged, exactly as before this package.
    if (e instanceof ErpNextError && e.status === 403) {
      return <InlineErrorState appError={toAppError(e)} homeHref="/sales" />;
    }
    throw e;
  }

  const breadcrumb = (
    <Breadcrumb
      items={[
        { label: "Home", href: "/" },
        { label: "Selling", href: "/sales/orders" },
        { label: "Sales Order", href: "/sales/orders" },
        { label: doc.customer },
      ]}
    />
  );

  // Upstream reference (the Quotation this order was made from, if any) — read directly
  // off this doc's own items, exactly how ERPNext's own dashboard does it
  // (sales_order_dashboard.py: `"internal_links": {"Quotation": ["items", "prevdoc_docname"]}`).
  // Works even in Draft, unlike the downstream query below, since it's not a separate
  // permission-checked lookup — the data is already part of the document we fetched.
  const sourceQuotations = Array.from(
    new Set(doc.items.map((item) => item.prevdoc_docname).filter((v): v is string => Boolean(v))),
  );
  const [downstreamConnections, timeline, session, billedByRef, relationshipMap] = await Promise.all([
    getConnections("Sales Order", doc.name),
    buildTimeline("Sales Order", doc.name, doc),
    verifySession((await cookies()).get(SESSION_COOKIE)?.value),
    getBilledQtyBySoDetail(doc.name),
    getRelationshipMap("Sales Order", doc.name),
  ]);
  const connections: Connection[] = [
    { label: "Quotation", href: "/sales/quotations", docs: sourceQuotations },
    ...downstreamConnections,
  ];
  // Show "Create Sales Invoice" whenever any line still has qty left to invoice —
  // ERPNext natively supports multiple partial Sales Invoices against one Sales Order
  // (see docs/ceylon-stack-sales-scenarios.md), so "already has a Sales Invoice" is no
  // longer the gate. See lib/fulfillment.ts for why billed qty is a live computed query,
  // not a stored field read.
  const hasRemainingToInvoice = doc.items.some((item) => item.qty - (billedByRef[item.name] ?? 0) > 1e-6);
  // Show "Create Delivery Note" whenever any line still has qty left to deliver —
  // `delivered_qty` is a real, live stored field ERPNext itself maintains (unlike
  // billedByRef above, no live-summed query is needed here). Mirrors
  // hasRemainingToInvoice's shape.
  const hasRemainingToDeliver = doc.items.some((item) => item.qty - (item.delivered_qty ?? 0) > 1e-6);
  // Show "Create Pick List" whenever any line still has qty left to pick — `picked_qty` is
  // a real, live stored field ERPNext itself maintains, same shape as delivered_qty. Pick
  // List is an optional stage (salesFlowMap.ts's `pick` node) — it doesn't gate
  // hasRemainingToDeliver above, since a Delivery Note can still be created directly.
  const hasRemainingToPick = doc.items.some((item) => item.qty - (item.picked_qty ?? 0) > 1e-6);
  // ERPNext only refuses to cancel over a *submitted* linked Sales Invoice (draft ones
  // don't block it — see the submittedDocs doc comment in lib/connections.ts). Same
  // check the server action runs for real; this just tells the user why up front instead
  // of letting them click Cancel and hit a rejection.
  const blockingInvoices = connections.find((c) => c.label === "Sales Invoice")?.submittedDocs ?? [];
  const status = salesOrderStatus(doc);

  const header = (
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-medium text-graphite-900">{doc.name}</h1>
        <div className="mt-1">
          <StatusPill label={status.label} tone={status.tone} />
        </div>
      </div>
      {doc.docstatus === 0 && (
        <DocActionBar action={submitSalesOrderAction.bind(null, doc.name)} label="Submit" pendingLabel="Submitting…" />
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
            action={cancelSalesOrderAction.bind(null, doc.name)}
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
        ...(doc.docstatus === 1 && hasRemainingToPick
          ? [{ label: "Create Pick List", href: `/sales/orders/${encodeURIComponent(doc.name)}/create-pick-list` }]
          : []),
        ...(doc.docstatus === 1 && hasRemainingToDeliver
          ? [{ label: "Create Delivery Note", href: `/sales/orders/${encodeURIComponent(doc.name)}/create-delivery` }]
          : []),
        ...(doc.docstatus === 1 && hasRemainingToInvoice
          ? [{ label: "Create Sales Invoice", href: `/sales/orders/${encodeURIComponent(doc.name)}/create-invoice` }]
          : []),
      ]}
      relationshipMap={relationshipMap}
    />
  );

  const commentsTab = (
    <ActivityTimeline
      currentUserFullName={session?.fullName ?? ""}
      entries={timeline}
      postComment={postCommentAction.bind(null, "Sales Order", doc.name, `/sales/orders/${encodeURIComponent(doc.name)}`)}
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
      <SalesOrderForm
        action={updateSalesOrderAction.bind(null, doc.name)}
        itemOptions={itemOptions}
        customers={customers}
        companies={defaults.companies}
        currency={defaults.currency}
        sellingPriceList={defaults.sellingPriceList}
        initial={{
          customer: doc.customer,
          transaction_date: doc.transaction_date,
          delivery_date: doc.delivery_date,
          order_type: doc.order_type,
          company: doc.company,
          // quotation_item/prevdoc_docname (source_quotation here) round-trip through the edit
          // form too, not just at initial creation — otherwise re-saving a Draft that came from
          // either the dedicated create-order flow or "Copy From Quotation" would silently drop
          // its real ERPNext linkage back to the source Quotation the moment it's edited once.
          items: doc.items.map((i) => ({
            item_code: i.item_code,
            item_name: i.item_name,
            qty: i.qty,
            uom: i.uom,
            rate: i.rate,
            ...(i.quotation_item && i.prevdoc_docname
              ? { quotation_item: i.quotation_item, source_quotation: i.prevdoc_docname }
              : {}),
            ...(i.price_list_rate
              ? {
                  price_list_rate: i.price_list_rate,
                  discount_percentage: i.discount_percentage,
                  discount_amount: i.discount_amount,
                  pricing_rules: i.pricing_rules,
                }
              : {}),
          })),
          apply_discount_on: doc.apply_discount_on,
          additional_discount_percentage: doc.additional_discount_percentage,
          discount_amount: doc.discount_amount,
        }}
      />
    );

    addressContactTab = (
      <AddressContactFields
        formId="sales-order-form"
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
        formId="sales-order-form"
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
            form="sales-order-form"
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
              form="sales-order-form"
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
              form="sales-order-form"
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
          <DocField label="Date" value={doc.transaction_date} mono />
          <DocField label="Delivery date" value={doc.delivery_date || "—"} mono />
          <DocField label="Order type" value={doc.order_type} />
          <DocField label="Company" value={doc.company} />
          <DocField label="Net total" value={`${formatAmount(doc.net_total)} ${doc.currency}`} mono />
          {(doc.additional_discount_percentage || doc.discount_amount) ? (
            <DocField
              label={`Discount (on ${doc.apply_discount_on ?? "Grand Total"})`}
              value={
                doc.additional_discount_percentage
                  ? `${doc.additional_discount_percentage}%`
                  : `${formatAmount(doc.discount_amount ?? 0)} ${doc.currency}`
              }
              mono
            />
          ) : null}
          <DocField label="Grand total" value={`${formatAmount(doc.grand_total)} ${doc.currency}`} mono />
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
