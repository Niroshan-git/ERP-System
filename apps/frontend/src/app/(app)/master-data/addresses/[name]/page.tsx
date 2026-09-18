import { notFound } from "next/navigation";
import { MasterForm, type FieldSpec } from "@/components/MasterForm";
import { ErpNextError, getDoc } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { ADDRESS_TYPES } from "../addressTypes";
import { updateAddressAction } from "../actions";

type AddressDoc = {
  name: string;
  address_title?: string;
  address_type: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state?: string;
  country?: string;
  pincode?: string;
  email_id?: string;
  phone?: string;
  disabled?: 0 | 1;
};

export default async function EditAddressPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;

  let doc: AddressDoc;
  try {
    doc = await getDoc<AddressDoc>("Address", decodeURIComponent(name));
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  const countries = await fetchLinkOptions("Country");

  const fields: FieldSpec[] = [
    { kind: "text", id: "address_title", label: "Address title" },
    { kind: "select", id: "address_type", label: "Address type", options: ADDRESS_TYPES, required: true },
    { kind: "text", id: "address_line1", label: "Address line 1", required: true },
    { kind: "text", id: "address_line2", label: "Address line 2" },
    { kind: "text", id: "city", label: "City", required: true },
    { kind: "text", id: "state", label: "State" },
    { kind: "link", id: "country", label: "Country", options: countries, required: true },
    { kind: "text", id: "pincode", label: "Pincode" },
    { kind: "text", id: "email_id", label: "Email" },
    { kind: "text", id: "phone", label: "Phone" },
    { kind: "checkbox", id: "disabled", label: "Disabled" },
  ];

  return (
    <div>
      <h1 className="mb-1 text-2xl font-medium text-graphite-900">{doc.address_title || doc.name}</h1>
      <p className="mb-4 font-mono text-xs text-graphite-500">{doc.name}</p>
      <MasterForm action={updateAddressAction.bind(null, doc.name)} fields={fields} initial={doc} />
    </div>
  );
}
