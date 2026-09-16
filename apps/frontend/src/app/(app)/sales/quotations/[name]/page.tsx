import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { QuotationForm } from "@/components/QuotationForm";
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
import { quotationStatus } from "@/lib/erpStatus";
import { buildTimeline } from "@/lib/timeline";
import { postCommentAction } from "@/lib/actions/comments";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import Link from "next/link";
import {
  amendQuotationAction,
  cancelQuotationAction,
  submitQuotationAction,
  updateQuotationAction,
} from "../actions";

type QuotationDoc = {
  name: string;
  party_name: string;
  transaction_date: string;
  valid_till?: string;
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
  creation: string;
  owner: string;
  modified: string;
  modified_by: string;
  items: (LineItemRow & {
    name: string;
    ordered_qty?: number;
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
  /** Real, stored Link field back to the cancelled Quotation this one was amended from
   * (confirmed via the live DocType JSON) — set by amendQuotationAction, empty otherwise. */
  amended_from?: string;
};

export default async function QuotationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { name } = await params;
  const { saved } = await searchParams;

  let doc: QuotationDoc;
  try {
    doc = await getDoc<QuotationDoc>("Quotation", decodeURIComponent(name));
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  const breadcrumb = (
    <Breadcrumb
      items={[
        { label: "Home", href: "/" },
        { label: "Selling", href: "/sales/quotations" },
        { label: "Quotation", href: "/sales/quotations" },
        { label: doc.party_name },
      ]}
    />
  );

  const [downstreamConnections, timeline, session, relationshipMap, amendedTo] = await Promise.all([
    getConnections("Quotation", doc.name),
    buildTimeline("Quotation", doc.name, doc),
    verifySession((await cookies()).get(SESSION_COOKIE)?.value),
    getRelationshipMap("Quotation", doc.name),
    // Only a Cancelled quotation can have been amended (mirrors
    // `frappe.client.is_document_amended`'s own docstatus-2-only precondition) — skip the
    // query otherwise. `amended_from` lives directly on Quotation itself (not a child
    // table), so this queries the doctype's own field rather than going through
    // getConnections's child-table-filter shape.
    doc.docstatus === 2
      ? listDocs<{ name: string }>("Quotation", { fields: ["name"], filters: [["amended_from", "=", doc.name]], limit: 5 })
      : Promise.resolve([]),
  ]);
  // Show "Create Sales Order" whenever any line still has qty left to order —
  // ERPNext natively supports multiple partial Sales Orders against one Quotation
  // (see docs/ceylon-stack-sales-scenarios.md), so "already has a Sales Order" is no
  // longer the gate. `ordered_qty` is ERPNext's own real, live-maintained field (see
  // createSalesOrderFromQuotationAction's doc comment for how it's kept in sync).
  // Gap found live-verifying "Set as Lost" (2026-09-15): ERPNext's own
  // `quotation.py::_make_sales_order`/`make_sales_order` has NO server-side guard against
  // mapping a "Lost" quotation to a Sales Order — the only real enforcement is Desk's own
  // `quotation.js::refresh` hiding the "Sales Order" create button once
  // `status in ["Lost", "Ordered"]`. Confirmed by calling `make_sales_order` directly against
  // a Lost quotation over REST: it succeeded and returned a valid mapped Sales Order Draft.
  // `doc.status !== "Lost"` mirrors that same real Desk condition here (the "Ordered" half is
  // already implied by hasRemainingLines being false once nothing is left to order); see the
  // matching guard added to createSalesOrderFromQuotationAction for the actual enforcement,
  // since ERPNext itself doesn't provide one.
  const hasRemainingLines = doc.status !== "Lost" && doc.items.some((item) => item.qty - (item.ordered_qty ?? 0) > 1e-6);
  const connections: Connection[] = [
    ...(doc.amended_from ? [{ label: "Amended From", href: "/sales/quotations", docs: [doc.amended_from] }] : []),
    ...(amendedTo.length > 0
      ? [{ label: "Amended To", href: "/sales/quotations", docs: amendedTo.map((d) => d.name) }]
      : []),
    ...downstreamConnections,
  ];
  // Same cancel-blocking rule as the Sales Order page: ERPNext only refuses to cancel
  // over a *submitted* linked Sales Order (see submittedDocs doc comment in
  // lib/connections.ts). The server action re-checks this for real; this is just so the
  // user sees why up front instead of hitting a rejection after clicking Cancel.
  const blockingOrders = connections.find((c) => c.label === "Sales Order")?.submittedDocs ?? [];
  // Real Desk gate for the "Set as Lost" button (`quotation.js::refresh`, confirmed live):
  // `docstatus == 1 && !["Lost", "Ordered"].includes(status)`. Note this still allows a
  // "Partially Ordered" quotation through — `declare_enquiry_lost` itself then rejects
  // those server-side ("Cannot set as Lost as Sales Order is made."), which is real
  // ERPNext behavior being mirrored here, not a gap in this gate.
  const canSetAsLost = doc.docstatus === 1 && doc.status !== "Lost" && doc.status !== "Ordered";
  const status = quotationStatus(doc);

  const header = (
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-medium text-graphite-900">{doc.name}</h1>
        <div className="mt-1">
          <StatusPill label={status.label} tone={status.tone} />
        </div>
      </div>
      {doc.docstatus === 0 && (
        <DocActionBar action={submitQuotationAction.bind(null, doc.name)} label="Submit" pendingLabel="Submitting…" />
      )}
      {doc.docstatus === 1 && (
        <div className="flex items-center gap-3">
          {canSetAsLost && (
            <Link
              href={`/sales/quotations/${encodeURIComponent(doc.name)}/set-as-lost`}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-graphite-900 hover:bg-surface"
            >
              Set as Lost
            </Link>
          )}
          {blockingOrders.length > 0 ? (
            <p className="text-sm text-alert">
              Cannot cancel — linked with Sales Order{" "}
              {blockingOrders.map((ordName, i) => (
                <span key={ordName}>
                  {i > 0 && ", "}
                  <a href={`/sales/orders/${encodeURIComponent(ordName)}`} className="underline">
                    {ordName}
                  </a>
                </span>
              ))}
              . Cancel that first.
            </p>
          ) : (
            <DocActionBar
              action={cancelQuotationAction.bind(null, doc.name)}
              label="Cancel"
              pendingLabel="Cancelling…"
              variant="danger"
            />
          )}
        </div>
      )}
      {doc.docstatus === 2 &&
        (amendedTo.length > 0 ? (
          <p className="text-sm text-graphite-500">
            Already amended as{" "}
            <a href={`/sales/quotations/${encodeURIComponent(amendedTo[0].name)}`} className="underline">
              {amendedTo[0].name}
            </a>
            .
          </p>
        ) : (
          <DocActionBar action={amendQuotationAction.bind(null, doc.name)} label="Amend" pendingLabel="Amending…" />
        ))}
    </div>
  );

  const connectionsTab = (
    <ConnectionsPanel
      connections={connections}
      createAction={
        doc.docstatus === 1 && hasRemainingLines
          ? { label: "Create Sales Order", href: `/sales/quotations/${encodeURIComponent(doc.name)}/create-order` }
          : undefined
      }
      relationshipMap={relationshipMap}
    />
  );

  const commentsTab = (
    <ActivityTimeline
      currentUserFullName={session?.fullName ?? ""}
      entries={timeline}
      postComment={postCommentAction.bind(null, "Quotation", doc.name, `/sales/quotations/${encodeURIComponent(doc.name)}`)}
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
      <QuotationForm
        action={updateQuotationAction.bind(null, doc.name)}
        itemOptions={itemOptions}
        customers={customers}
        companies={defaults.companies}
        currency={defaults.currency}
        sellingPriceList={defaults.sellingPriceList}
        initial={{
          party_name: doc.party_name,
          transaction_date: doc.transaction_date,
          valid_till: doc.valid_till,
          order_type: doc.order_type,
          company: doc.company,
          items: doc.items.map((i) => ({
            item_code: i.item_code,
            item_name: i.item_name,
            qty: i.qty,
            uom: i.uom,
            rate: i.rate,
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
        formId="quotation-form"
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
        formId="quotation-form"
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
            form="quotation-form"
            defaultValue={doc.title}
            className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
          />
        </div>
      </div>
    );
  } else {
    detailsTab = (
      <div>
        <dl className="mb-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <DocField label="Customer" value={doc.party_name} />
          <DocField label="Date" value={doc.transaction_date} mono />
          <DocField label="Valid till" value={doc.valid_till || "—"} mono />
          <DocField label="Order type" value={doc.order_type} />
          <DocField label="Company" value={doc.company} />
          <DocField label="Net total" value={`${doc.net_total.toFixed(2)} ${doc.currency}`} mono />
          {(doc.additional_discount_percentage || doc.discount_amount) ? (
            <>
              <DocField
                label={`Discount (on ${doc.apply_discount_on ?? "Grand Total"})`}
                value={
                  doc.additional_discount_percentage
                    ? `${doc.additional_discount_percentage}%`
                    : `${(doc.discount_amount ?? 0).toFixed(2)} ${doc.currency}`
                }
                mono
              />
            </>
          ) : null}
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
        <DocField label="Payment terms template" value={doc.payment_terms_template || "—"} />
        <DocField label="Terms and conditions template" value={doc.tc_name || "—"} />
        <DocField label="Terms" value={doc.terms || "—"} />
      </dl>
    );

    moreInfoTab = (
      <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
        <DocField label="Title" value={doc.title || "—"} />
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
