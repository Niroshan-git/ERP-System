import { notFound } from "next/navigation";
import { MasterForm, type FieldSpec } from "@/components/MasterForm";
import { ErpNextError, getDoc } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { updateSalesPartnerAction } from "../actions";

type SalesPartnerDoc = {
  name: string;
  partner_name: string;
  partner_type?: string;
  territory?: string;
  commission_rate?: number;
  introduction?: string;
};

export default async function EditSalesPartnerPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;

  let doc: SalesPartnerDoc;
  try {
    doc = await getDoc<SalesPartnerDoc>("Sales Partner", decodeURIComponent(name));
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

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
      <h1 className="mb-1 text-2xl font-medium text-graphite-900">{doc.partner_name}</h1>
      <p className="mb-4 font-mono text-xs text-graphite-500">{doc.name}</p>
      <MasterForm action={updateSalesPartnerAction.bind(null, doc.name)} fields={fields} initial={doc} />
    </div>
  );
}
