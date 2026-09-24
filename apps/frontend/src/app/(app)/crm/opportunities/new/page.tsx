import { Breadcrumb } from "@/components/Breadcrumb";
import { OpportunityForm, type OpportunityFormOptions, type PartyOption } from "@/components/OpportunityForm";
import { listDocs } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { listItemOptions } from "@/lib/actions/itemLookup";
import { getSellingDefaults } from "@/lib/salesDefaults";
import { createOpportunityAction } from "../actions";

type LeadOption = { name: string; lead_name: string };
type CustomerOption = { name: string; customer_name: string };

export default async function NewOpportunityPage() {
  const [
    leads,
    customers,
    opportunityTypes,
    territories,
    industries,
    marketSegments,
    customerGroups,
    countries,
    contacts,
    addresses,
    itemOptions,
    defaults,
  ] = await Promise.all([
    listDocs<LeadOption>("Lead", {
      fields: ["name", "lead_name"],
      filters: [["status", "not in", ["Converted", "Do Not Contact"]]],
      limit: 500,
      orderBy: "lead_name asc",
    }),
    listDocs<CustomerOption>("Customer", { fields: ["name", "customer_name"], limit: 500, orderBy: "customer_name asc" }),
    fetchLinkOptions("Opportunity Type"),
    fetchLinkOptions("Territory"),
    fetchLinkOptions("Industry Type"),
    fetchLinkOptions("Market Segment"),
    fetchLinkOptions("Customer Group"),
    fetchLinkOptions("Country"),
    fetchLinkOptions("Contact"),
    fetchLinkOptions("Address"),
    listItemOptions(),
    getSellingDefaults(),
  ]);

  const partyOptions: { leads: PartyOption[]; customers: PartyOption[] } = {
    leads: leads.map((l) => ({ value: l.name, label: l.lead_name || l.name })),
    customers: customers.map((c) => ({ value: c.name, label: c.customer_name || c.name })),
  };

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
    currency: defaults.currency,
  };

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "CRM", href: "/crm" },
          { label: "Opportunities", href: "/crm/opportunities" },
          { label: "New" },
        ]}
      />
      <h1 className="mb-4 text-2xl font-medium text-graphite-900">New opportunity</h1>
      <OpportunityForm action={createOpportunityAction} options={options} partyOptions={partyOptions} />
    </div>
  );
}
