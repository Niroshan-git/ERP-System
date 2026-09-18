import { notFound } from "next/navigation";
import { MasterForm, type FieldSpec } from "@/components/MasterForm";
import { ErpNextError, getDoc } from "@/lib/erpnext";
import { updateContactAction } from "../actions";

type ContactDoc = {
  name: string;
  first_name: string;
  last_name?: string;
  email_id?: string;
  phone?: string;
  mobile_no?: string;
  company_name?: string;
  designation?: string;
};

const fields: FieldSpec[] = [
  { kind: "text", id: "first_name", label: "First name", required: true },
  { kind: "text", id: "last_name", label: "Last name" },
  { kind: "text", id: "email_id", label: "Email" },
  { kind: "text", id: "phone", label: "Phone" },
  { kind: "text", id: "mobile_no", label: "Mobile no." },
  { kind: "text", id: "company_name", label: "Company name" },
  { kind: "text", id: "designation", label: "Designation" },
];

export default async function EditContactPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;

  let doc: ContactDoc;
  try {
    doc = await getDoc<ContactDoc>("Contact", decodeURIComponent(name));
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-medium text-graphite-900">
        {[doc.first_name, doc.last_name].filter(Boolean).join(" ")}
      </h1>
      <p className="mb-4 font-mono text-xs text-graphite-500">{doc.name}</p>
      <MasterForm action={updateContactAction.bind(null, doc.name)} fields={fields} initial={doc} />
    </div>
  );
}
