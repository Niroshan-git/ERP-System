import { MasterForm, type FieldSpec } from "@/components/MasterForm";
import { createCampaignAction } from "../actions";

const fields: FieldSpec[] = [
  { kind: "text", id: "campaign_name", label: "Campaign name", required: true },
  { kind: "textarea", id: "description", label: "Description" },
];

export default function NewCampaignPage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-medium text-graphite-900">New campaign</h1>
      <MasterForm action={createCampaignAction} fields={fields} />
    </div>
  );
}
