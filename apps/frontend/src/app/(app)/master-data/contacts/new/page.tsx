import { MasterForm, type FieldSpec } from "@/components/MasterForm";
import { createContactAction } from "../actions";

const fields: FieldSpec[] = [
  { kind: "text", id: "first_name", label: "First name", required: true },
  { kind: "text", id: "last_name", label: "Last name" },
  { kind: "text", id: "email_id", label: "Email" },
  { kind: "text", id: "phone", label: "Phone" },
  { kind: "text", id: "mobile_no", label: "Mobile no." },
  { kind: "text", id: "company_name", label: "Company name" },
  { kind: "text", id: "designation", label: "Designation" },
];

export default function NewContactPage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-medium text-graphite-900">New contact</h1>
      <MasterForm action={createContactAction} fields={fields} />
    </div>
  );
}
