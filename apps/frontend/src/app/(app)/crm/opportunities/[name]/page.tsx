import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { Breadcrumb } from "@/components/Breadcrumb";
import { DocTabs } from "@/components/DocTabs";
import { DocField } from "@/components/DocField";
import { StatusPill } from "@/components/StatusPill";
import { SavedBanner } from "@/components/SavedBanner";
import { OpportunityForm, type OpportunityFormOptions } from "@/components/OpportunityForm";
import { CrmActivityPanel } from "@/components/CrmActivityPanel";
import { ErpNextError, getDoc, listDocs } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { listItemOptions } from "@/lib/actions/itemLookup";
import { opportunityStatus } from "@/lib/erpStatus";
import { formatAmount } from "@/lib/format";
import { getCrmActivityTimeline, listOpenFollowups, followupBucket, type CrmNoteRow } from "@/lib/crmActivity";
import { stripHtml } from "@/lib/timeline";
import { postCommentAction } from "@/lib/actions/comments";
import {
  completeFollowupAction,
  createFollowupAction,
  createCallAction,
  createMeetingAction,
  createNoteAction,
} from "@/lib/actions/crmActivity";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { updateOpportunityAction } from "../actions";

type OpportunityDoc = {
  name: string;
  title?: string;
  opportunity_from: string;
  party_name: string;
  customer_name?: string;
  status: string;
  opportunity_type?: string;
  sales_stage?: string;
  opportunity_owner?: string;
  expected_closing?: string;
  probability?: number;
  opportunity_amount?: number;
  currency: string;
  territory?: string;
  industry?: string;
  market_segment?: string;
  customer_group?: string;
  no_of_employees?: string;
  annual_revenue?: number;
  website?: string;
  city?: string;
  state?: string;
  country?: string;
  contact_person?: string;
  contact_email?: string;
  contact_mobile?: string;
  whatsapp?: string;
  phone?: string;
  phone_ext?: string;
  customer_address?: string;
  transaction_date?: string;
  items: { item_code: string; item_name: string; qty: number; uom: string; rate: number; amount: number }[];
  total?: number;
  notes?: CrmNoteRow[];
  creation: string;
  owner: string;
  modified: string;
  modified_by: string;
};

type QuotationLink = { name: string; status: string; grand_total: number; currency: string };

export default async function OpportunityDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { name } = await params;
  const { saved } = await searchParams;

  let doc: OpportunityDoc;
  try {
    doc = await getDoc<OpportunityDoc>("Opportunity", decodeURIComponent(name));
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  const [
    opportunityTypes,
    territories,
    industries,
    marketSegments,
    customerGroups,
    countries,
    contacts,
    addresses,
    itemOptions,
    timeline,
    session,
    linkedQuotations,
    owners,
    openFollowupsRaw,
  ] = await Promise.all([
    fetchLinkOptions("Opportunity Type"),
    fetchLinkOptions("Territory"),
    fetchLinkOptions("Industry Type"),
    fetchLinkOptions("Market Segment"),
    fetchLinkOptions("Customer Group"),
    fetchLinkOptions("Country"),
    fetchLinkOptions("Contact"),
    fetchLinkOptions("Address"),
    listItemOptions(),
    getCrmActivityTimeline("Opportunity", doc.name, doc),
    verifySession((await cookies()).get(SESSION_COOKIE)?.value),
    listDocs<QuotationLink>("Quotation", {
      fields: ["name", "status", "grand_total", "currency"],
      filters: [["opportunity", "=", doc.name]],
      orderBy: "creation desc",
    }),
    fetchLinkOptions("User"),
    listOpenFollowups("Opportunity", doc.name),
  ]);

  const options: OpportunityFormOptions = {
    opportunityTypes,
    territories,
    industries,
    marketSegments,
    customerGroups,
    countries,
    contacts,
    addresses,
    itemOptions,
    currency: doc.currency,
  };

  const status = opportunityStatus(doc);
  const weightedValue = ((doc.opportunity_amount ?? 0) * (doc.probability ?? 0)) / 100;

  const revalidateHref = `/crm/opportunities/${encodeURIComponent(doc.name)}`;
  const openFollowups = openFollowupsRaw
    .slice()
    .sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999"))
    .map((t) => ({
      todoName: t.name,
      description: stripHtml(t.description ?? "") || "Follow-up",
      dueDate: t.date,
      bucket: followupBucket(t.date, t.status, "Open"),
      assignedTo: t.allocated_to,
    }));
  const nextFollowup = openFollowups[0] ?? null;

  // A resolved Opportunity is one this app no longer offers day-to-day pipeline actions on —
  // same "resolved" judgement call `LeadDetailPage` already makes for Lead's own status.
  const isResolved = doc.status === "Lost" || doc.status === "Converted" || doc.status === "Closed";
  const canMarkLost = !isResolved;
  // Per lib/actions/opportunityQuotation.ts's doc comment: Quotation creation only supports
  // a Customer-partied Opportunity in V1 — the existing Sales Quotation frontend has never
  // been built to accept quotation_to: "Lead".
  const canCreateQuotation = !isResolved && doc.opportunity_from === "Customer";

  const partyHref =
    doc.opportunity_from === "Lead"
      ? `/crm/leads/${encodeURIComponent(doc.party_name)}`
      : doc.opportunity_from === "Customer"
        ? `/master-data/customers/${encodeURIComponent(doc.party_name)}`
        : undefined;

  const breadcrumb = (
    <Breadcrumb
      items={[
        { label: "Home", href: "/" },
        { label: "CRM", href: "/crm" },
        { label: "Opportunities", href: "/crm/opportunities" },
        { label: doc.title || doc.name },
      ]}
    />
  );

  const header = (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-medium text-graphite-900">{doc.title || doc.name}</h1>
        <p className="mb-1 font-mono text-xs text-graphite-500">{doc.name}</p>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill label={status.label} tone={status.tone} />
          {doc.sales_stage && <StatusPill label={doc.sales_stage} tone="neutral" />}
          {nextFollowup && (
            <StatusPill
              label={`Next Follow-up: ${nextFollowup.description}${nextFollowup.dueDate ? ` — ${nextFollowup.dueDate}` : ""}`}
              tone={
                nextFollowup.bucket === "overdue"
                  ? "alert"
                  : nextFollowup.bucket === "due_today"
                    ? "signal"
                    : "neutral"
              }
            />
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {canCreateQuotation && (
          <Link
            href={`/crm/opportunities/${encodeURIComponent(doc.name)}/create-quotation`}
            className="rounded-md bg-signal px-3 py-1.5 text-sm font-medium text-white hover:bg-signal/90"
          >
            Create Quotation
          </Link>
        )}
        {canMarkLost && (
          <Link
            href={`/crm/opportunities/${encodeURIComponent(doc.name)}/lost`}
            className="rounded-md border border-alert px-3 py-1.5 text-sm font-medium text-alert hover:bg-alert/10"
          >
            Mark Lost
          </Link>
        )}
      </div>
    </div>
  );

  const overviewTab = (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-surface p-4 sm:grid-cols-4">
        <DocField
          label="Party"
          value={
            partyHref ? (
              <Link href={partyHref} className="text-signal hover:underline">
                {doc.customer_name || doc.party_name}
              </Link>
            ) : (
              doc.customer_name || doc.party_name
            )
          }
        />
        <DocField label="Expected value" value={`${formatAmount(doc.opportunity_amount ?? 0)} ${doc.currency}`} />
        <DocField label="Probability" value={`${doc.probability ?? 0}%`} />
        <DocField label="Weighted value" value={`${formatAmount(weightedValue)} ${doc.currency}`} />
        <DocField label="Expected close" value={doc.expected_closing || "—"} mono />
        <DocField label="Owner" value={doc.opportunity_owner || "—"} />
        <DocField label="Source party type" value={doc.opportunity_from} />
        <DocField label="Total (items)" value={`${formatAmount(doc.total ?? 0)} ${doc.currency}`} />
      </div>
      <OpportunityForm
        action={updateOpportunityAction.bind(null, doc.name)}
        options={options}
        initial={{ ...doc, items: doc.items }}
      />
    </div>
  );

  const linkedRecordsTab = (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="mb-2 text-sm font-semibold text-graphite-900">
          {doc.opportunity_from === "Lead" ? "Originating Lead" : "Customer"}
        </h2>
        {partyHref ? (
          <Link href={partyHref} className="text-sm text-signal hover:underline">
            {doc.customer_name || doc.party_name}
          </Link>
        ) : (
          <p className="text-sm text-graphite-500">{doc.party_name}</p>
        )}
      </div>
      <div>
        <h2 className="mb-2 text-sm font-semibold text-graphite-900">Quotations</h2>
        {linkedQuotations.length > 0 ? (
          <ul className="space-y-1 text-sm">
            {linkedQuotations.map((q) => (
              <li key={q.name} className="flex items-center gap-2">
                <Link href={`/sales/quotations/${encodeURIComponent(q.name)}`} className="font-mono text-signal hover:underline">
                  {q.name}
                </Link>
                <StatusPill label={q.status} tone="neutral" />
                <span className="text-graphite-500">
                  {formatAmount(q.grand_total)} {q.currency}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-graphite-500">No Quotations created from this Opportunity yet.</p>
        )}
      </div>
    </div>
  );

  const activityTab = (
    <CrmActivityPanel
      currentUserFullName={session?.fullName ?? ""}
      currentUserEmail={session?.email ?? ""}
      userOptions={owners}
      timeline={timeline}
      nextFollowup={nextFollowup}
      openFollowups={openFollowups}
      logCallAction={createCallAction.bind(null, "Opportunity", doc.name, revalidateHref)}
      scheduleMeetingAction={createMeetingAction.bind(null, "Opportunity", doc.name, revalidateHref)}
      createFollowupAction={createFollowupAction.bind(null, "Opportunity", doc.name, revalidateHref)}
      addNoteAction={createNoteAction.bind(null, "Opportunity", doc.name, revalidateHref)}
      completeFollowupAction={completeFollowupAction.bind(null, revalidateHref)}
      postComment={postCommentAction.bind(null, "Opportunity", doc.name, revalidateHref)}
    />
  );

  return (
    <div>
      {breadcrumb}
      <SavedBanner show={saved === "1"} />
      {header}
      <DocTabs
        tabs={[
          { id: "overview", label: "Overview", content: overviewTab },
          { id: "linked-records", label: "Linked Records", content: linkedRecordsTab },
          { id: "comments", label: "Activity", content: activityTab },
        ]}
      />
    </div>
  );
}
