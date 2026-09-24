import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { Breadcrumb } from "@/components/Breadcrumb";
import { DocTabs } from "@/components/DocTabs";
import { DocField } from "@/components/DocField";
import { StatusPill } from "@/components/StatusPill";
import { SavedBanner } from "@/components/SavedBanner";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { LeadForm, type LeadFormOptions } from "@/components/LeadForm";
import { LeadStatusControl } from "@/components/LeadStatusControl";
import { ConvertButtonClient } from "@/components/ConvertButtonClient";
import { ErpNextError, getDoc, listDocs } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { leadStatus } from "@/lib/erpStatus";
import { buildTimeline } from "@/lib/timeline";
import { postCommentAction } from "@/lib/actions/comments";
import { convertLeadToCustomerAction, convertLeadToOpportunityAction } from "@/lib/actions/leadConversion";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { updateLeadAction, updateLeadStatusAction } from "../actions";

type LeadDoc = {
  name: string;
  lead_name: string;
  status: string;
  salutation?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  job_title?: string;
  gender?: string;
  type?: string;
  request_type?: string;
  email_id?: string;
  website?: string;
  mobile_no?: string;
  whatsapp_no?: string;
  phone?: string;
  phone_ext?: string;
  company_name?: string;
  no_of_employees?: string;
  annual_revenue?: number;
  industry?: string;
  market_segment?: string;
  city?: string;
  state?: string;
  country?: string;
  territory?: string;
  lead_owner?: string;
  company?: string;
  qualification_status?: string;
  qualified_by?: string;
  qualified_on?: string;
  disabled?: 0 | 1;
  unsubscribed?: 0 | 1;
  creation: string;
  owner: string;
  modified: string;
  modified_by: string;
};

type OpportunityLink = { name: string; status: string };
type CustomerLink = { name: string; customer_name: string };

export default async function LeadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ saved?: string; converted_opportunity?: string }>;
}) {
  const { name } = await params;
  const { saved, converted_opportunity: convertedOpportunity } = await searchParams;

  let doc: LeadDoc;
  try {
    doc = await getDoc<LeadDoc>("Lead", decodeURIComponent(name));
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  const [
    salutations,
    genders,
    industries,
    marketSegments,
    countries,
    territories,
    owners,
    companies,
    timeline,
    session,
    linkedOpportunities,
    linkedCustomers,
  ] = await Promise.all([
    fetchLinkOptions("Salutation"),
    fetchLinkOptions("Gender"),
    fetchLinkOptions("Industry Type"),
    fetchLinkOptions("Market Segment"),
    fetchLinkOptions("Country"),
    fetchLinkOptions("Territory"),
    fetchLinkOptions("User"),
    fetchLinkOptions("Company"),
    buildTimeline("Lead", doc.name, doc),
    verifySession((await cookies()).get(SESSION_COOKIE)?.value),
    listDocs<OpportunityLink>("Opportunity", {
      fields: ["name", "status"],
      filters: [
        ["opportunity_from", "=", "Lead"],
        ["party_name", "=", doc.name],
      ],
      orderBy: "creation desc",
    }),
    listDocs<CustomerLink>("Customer", {
      fields: ["name", "customer_name"],
      filters: [["lead_name", "=", doc.name]],
      orderBy: "creation desc",
    }),
  ]);

  const options: LeadFormOptions = { salutations, genders, industries, marketSegments, countries, territories, owners, companies };
  const status = leadStatus(doc);

  // See lib/actions/leadConversion.ts's doc comments for the exact field mapping. Gating
  // below is a Ceylon Stack UX decision (ERPNext itself doesn't block re-conversion):
  // "Convert to Customer" is hidden once a Customer already points back at this Lead, to
  // avoid a same-name Customer create colliding (a real 409 ERPNext would reject anyway,
  // just surfaced earlier and more clearly here); "Convert to Opportunity" stays available
  // for every open status since one Lead can reasonably become more than one Opportunity,
  // only hidden once the Lead itself is fully resolved (Converted / Do Not Contact).
  const isResolved = doc.status === "Converted" || doc.status === "Do Not Contact";
  const canConvertToOpportunity = !isResolved;
  const canConvertToCustomer = !isResolved && linkedCustomers.length === 0;

  const breadcrumb = (
    <Breadcrumb
      items={[
        { label: "Home", href: "/" },
        { label: "CRM", href: "/crm" },
        { label: "Leads", href: "/crm/leads" },
        { label: doc.lead_name || doc.name },
      ]}
    />
  );

  const header = (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-medium text-graphite-900">{doc.lead_name || doc.name}</h1>
        <p className="mb-1 font-mono text-xs text-graphite-500">{doc.name}</p>
        <StatusPill label={status.label} tone={status.tone} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {canConvertToOpportunity && (
          <ConvertButtonClient action={convertLeadToOpportunityAction.bind(null, doc.name)} label="Convert to Opportunity" />
        )}
        {canConvertToCustomer && (
          <ConvertButtonClient action={convertLeadToCustomerAction.bind(null, doc.name)} label="Convert to Customer" />
        )}
      </div>
    </div>
  );

  const overviewTab = (
    <div>
      <div className="mb-4 flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
        <span className="text-sm font-medium text-graphite-900">Status</span>
        <LeadStatusControl action={updateLeadStatusAction.bind(null, doc.name)} currentStatus={doc.status} />
      </div>
      <LeadForm action={updateLeadAction.bind(null, doc.name)} options={options} initial={doc} />
    </div>
  );

  const linkedRecordsTab = (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="mb-2 text-sm font-semibold text-graphite-900">Opportunities</h2>
        {linkedOpportunities.length > 0 ? (
          <ul className="space-y-1 text-sm">
            {linkedOpportunities.map((o) => (
              <li key={o.name} className="flex items-center gap-2">
                {/* No /crm/opportunities/[name] route exists yet (CRM-2 scope) — plain text,
                    not a link to a page that doesn't exist, same rule the conversion banner
                    below follows. */}
                <span className="font-mono text-graphite-900">{o.name}</span>
                <StatusPill label={o.status} tone="neutral" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-graphite-500">No Opportunities created from this Lead yet.</p>
        )}
      </div>
      <div>
        <h2 className="mb-2 text-sm font-semibold text-graphite-900">Customers</h2>
        {linkedCustomers.length > 0 ? (
          <ul className="space-y-1 text-sm">
            {linkedCustomers.map((c) => (
              <li key={c.name}>
                <Link href={`/master-data/customers/${encodeURIComponent(c.name)}`} className="text-signal hover:underline">
                  {c.customer_name}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-graphite-500">Not converted to a Customer yet.</p>
        )}
      </div>
      {(doc.qualified_by || doc.qualified_on) && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-graphite-900">Qualification</h2>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <DocField label="Qualified by" value={doc.qualified_by || "—"} />
            <DocField label="Qualified on" value={doc.qualified_on || "—"} mono />
          </dl>
        </div>
      )}
    </div>
  );

  const commentsTab = (
    <ActivityTimeline
      currentUserFullName={session?.fullName ?? ""}
      entries={timeline}
      postComment={postCommentAction.bind(null, "Lead", doc.name, `/crm/leads/${encodeURIComponent(doc.name)}`)}
    />
  );

  return (
    <div>
      {breadcrumb}
      <SavedBanner show={saved === "1"} />
      {convertedOpportunity && (
        <div className="mb-4 rounded-md border border-success/30 bg-success/10 px-4 py-2 text-sm font-medium text-success">
          Opportunity {convertedOpportunity} created.
        </div>
      )}
      {header}
      <DocTabs
        tabs={[
          { id: "overview", label: "Overview", content: overviewTab },
          { id: "linked-records", label: "Linked Records", content: linkedRecordsTab },
          { id: "comments", label: "Activity", content: commentsTab },
        ]}
      />
    </div>
  );
}
