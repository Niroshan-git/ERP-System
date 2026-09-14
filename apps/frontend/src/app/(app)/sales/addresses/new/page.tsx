import { MasterForm, type FieldSpec } from "@/components/MasterForm";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { ADDRESS_TYPES } from "../addressTypes";
import { createAddressAction } from "../actions";

export default async function NewAddressPage() {
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
      <h1 className="mb-4 text-2xl font-medium text-graphite-900">New address</h1>
      <MasterForm action={createAddressAction} fields={fields} />
    </div>
  );
}
