import { MasterForm, type FieldSpec } from "@/components/MasterForm";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { createSalesPartnerAction } from "../actions";

export default async function NewSalesPartnerPage() {
  const [partnerTypes, territories] = await Promise.all([
    fetchLinkOptions("Sales Partner Type"),
    fetchLinkOptions("Territory"),
  ]);

  const fields: FieldSpec[] = [
    { kind: "text", id: "partner_name", label: "Partner name", required: true },
    { kind: "link", id: "partner_type", label: "Partner type", options: partnerTypes },
    { kind: "link", id: "territory", label: "Territory", options: territories, required: true },
    { kind: "number", id: "commission_rate", label: "Commission rate", required: true },
    { kind: "textarea", id: "introduction", label: "Introduction" },
  ];

  return (
    <div>
      <h1 className="mb-4 text-2xl font-medium text-graphite-900">New sales partner</h1>
      <MasterForm action={createSalesPartnerAction} fields={fields} />
    </div>
  );
}
