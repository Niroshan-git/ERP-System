import { MasterForm, type FieldSpec } from "@/components/MasterForm";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { createSerialNoAction } from "../actions";

const STATUS_OPTIONS = ["Active", "Inactive", "Consumed", "Delivered", "Expired"];

/**
 * Secondary/manual path — most Serial Nos in practice get auto-created by Stock Entry/
 * Purchase Receipt submission (see actions.ts's doc comment). This form is for registering
 * pre-existing serialized stock ERPNext doesn't already know about.
 */
export default async function NewSerialNoPage() {
  const [items, warehouses, companies] = await Promise.all([
    fetchLinkOptions("Item"),
    fetchLinkOptions("Warehouse"),
    fetchLinkOptions("Company"),
  ]);

  const fields: FieldSpec[] = [
    { kind: "text", id: "serial_no", label: "Serial No", required: true },
    { kind: "link", id: "item_code", label: "Item", options: items, required: true },
    { kind: "link", id: "company", label: "Company", options: companies, required: true },
    { kind: "link", id: "warehouse", label: "Warehouse", options: warehouses },
    { kind: "select", id: "status", label: "Status", options: STATUS_OPTIONS },
  ];

  return (
    <div>
      <h1 className="mb-1 text-2xl font-medium text-graphite-900">New serial number</h1>
      <p className="mb-4 text-sm text-graphite-500">
        Most serial numbers are created automatically when a Stock Entry or Purchase Receipt is
        submitted. Use this form only to register serialized stock ERPNext doesn&apos;t already
        know about.
      </p>
      <MasterForm action={createSerialNoAction} fields={fields} />
    </div>
  );
}
