import { Breadcrumb } from "@/components/Breadcrumb";
import { LeadForm, type LeadFormOptions } from "@/components/LeadForm";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { createLeadAction } from "../actions";

export default async function NewLeadPage() {
  const [salutations, genders, industries, marketSegments, countries, territories, owners, companies] = await Promise.all([
    fetchLinkOptions("Salutation"),
    fetchLinkOptions("Gender"),
    fetchLinkOptions("Industry Type"),
    fetchLinkOptions("Market Segment"),
    fetchLinkOptions("Country"),
    fetchLinkOptions("Territory"),
    fetchLinkOptions("User"),
    fetchLinkOptions("Company"),
  ]);

  const options: LeadFormOptions = {
    salutations,
    genders,
    industries,
    marketSegments,
    countries,
    territories,
    owners,
    companies,
  };

  return (
    <div>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "CRM", href: "/crm" }, { label: "Leads", href: "/crm/leads" }, { label: "New" }]} />
      <h1 className="mb-4 text-2xl font-medium text-graphite-900">New lead</h1>
      <LeadForm action={createLeadAction} options={options} />
    </div>
  );
}
