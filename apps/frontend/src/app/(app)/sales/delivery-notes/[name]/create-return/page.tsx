import { notFound, redirect } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { LineSelectionEditor, type SelectableLineRow } from "@/components/LineSelectionEditor";
import { ErpNextError, getDoc, listDocs } from "@/lib/erpnext";
import { getReturnedQtyByDnDetail } from "@/lib/fulfillment";
import { getSellingDefaults } from "@/lib/salesDefaults";
import { createSalesReturnAction } from "../../actions";

type DeliveryNoteItemForSelection = {
  name: string;
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  rate: number;
  warehouse?: string;
};

type DeliveryNoteForSelection = {
  name: string;
  customer: string;
  company: string;
  docstatus: number;
  currency: string;
  is_return?: 0 | 1;
  items: DeliveryNoteItemForSelection[];
};

/**
 * Line-selection step in front of "Create Sales Return".
 */
export default async function CreateSalesReturnPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const deliveryNoteName = decodeURIComponent(name);

  let doc: DeliveryNoteForSelection;
  try {
    doc = await getDoc<DeliveryNoteForSelection>("Delivery Note", deliveryNoteName);
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  // Can only return against a submitted, non-return Delivery Note
  if (doc.docstatus !== 1 || doc.is_return === 1) {
    redirect(`/sales/delivery-notes/${encodeURIComponent(deliveryNoteName)}`);
  }

  const [returnedByRef, defaults, itemFlags] = await Promise.all([
    getReturnedQtyByDnDetail(deliveryNoteName),
    getSellingDefaults(doc.company),
    listDocs<{ name: string; has_batch_no?: 0 | 1; has_serial_no?: 0 | 1 }>("Item", {
      fields: ["name", "has_batch_no", "has_serial_no"],
      filters: [["name", "in", Array.from(new Set(doc.items.map((i) => i.item_code)))]],
      limit: 500,
    }).catch(() => []),
  ]);

  const flagsByItem = Object.fromEntries(itemFlags.map((i) => [i.name, i]));

  const rows: SelectableLineRow[] = doc.items.map((item) => ({
    reference: item.name,
    item_code: item.item_code,
    item_name: item.item_name,
    uom: item.uom,
    rate: item.rate,
    originalQty: item.qty,
    remainingQty: item.qty - (returnedByRef[item.name] ?? 0),
    warehouse: item.warehouse || defaults.defaultWarehouse,
    has_batch_no: Boolean(flagsByItem[item.item_code]?.has_batch_no),
    has_serial_no: Boolean(flagsByItem[item.item_code]?.has_serial_no),
  }));

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Selling", href: "/sales/delivery-notes" },
          { label: "Delivery Note", href: "/sales/delivery-notes" },
          { label: deliveryNoteName, href: `/sales/delivery-notes/${encodeURIComponent(deliveryNoteName)}` },
          { label: "Create Sales Return" },
        ]}
      />
      <h1 className="mb-1 text-2xl font-medium text-graphite-900">Create Sales Return</h1>
      <p className="mb-4 text-sm text-graphite-500">
        From Delivery Note <span className="font-mono">{deliveryNoteName}</span> — select which lines and how much of
        each to return to stock now. Lines already fully returned are shown disabled.
      </p>
      <LineSelectionEditor
        action={createSalesReturnAction.bind(null, deliveryNoteName)}
        rows={rows}
        currency={doc.currency}
        submitLabel="Create Sales Return"
        pendingLabel="Creating…"
      />
    </div>
  );
}
