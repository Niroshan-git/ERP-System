import { notFound } from "next/navigation";
import { MasterForm, type FieldSpec } from "@/components/MasterForm";
import { ErpNextError, getDoc } from "@/lib/erpnext";
import { updateCampaignAction } from "../actions";

type CampaignDoc = {
  name: string;
  campaign_name: string;
  description?: string;
};

const fields: FieldSpec[] = [
  { kind: "text", id: "campaign_name", label: "Campaign name", required: true },
  { kind: "textarea", id: "description", label: "Description" },
];

export default async function EditCampaignPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;

  let doc: CampaignDoc;
  try {
    doc = await getDoc<CampaignDoc>("Campaign", decodeURIComponent(name));
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-medium text-graphite-900">{doc.campaign_name}</h1>
      <p className="mb-4 font-mono text-xs text-graphite-500">{doc.name}</p>
      <MasterForm action={updateCampaignAction.bind(null, doc.name)} fields={fields} initial={doc} />
    </div>
  );
}
