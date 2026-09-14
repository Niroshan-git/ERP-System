import { notFound, redirect } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { LineSelectionEditor, type SelectableLineRow } from "@/components/LineSelectionEditor";
import { ErpNextError, getDoc } from "@/lib/erpnext";
import { getInvoicedQtyByDnDetail } from "@/lib/fulfillment";
import { createSalesInvoiceFromDeliveryNoteAction } from "../../../invoices/actions";

type DeliveryNoteItemForSelection = {
  name: string;
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  rate: number;
};

type DeliveryNoteForSelection = {
  name: string;
  customer: string;
  docstatus: number;
  currency: string;
  items: DeliveryNoteItemForSelection[];
};

/**
 * Line-selection step in front of "Create Sales Invoice" — partial billing of a Delivery
 * Note. Linked from the Delivery Note detail page's Connections tab (ConnectionsPanel's
 * href-based createAction) whenever at least one line still has qty left to invoice.
 * Remaining-to-invoice per line comes from getInvoicedQtyByDnDetail — see that file's doc
 * comment for why it's a live computed query, not a stored field read (Delivery Note Item
 * has no stored billed-qty field at all — mirrors the Sales Order -> Sales Invoice case
 * exactly, just keyed on `dn_detail` instead of `so_detail`).
 */
export default async function CreateSalesInvoiceFromDeliveryNotePage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const deliveryNoteName = decodeURIComponent(name);

  let doc: DeliveryNoteForSelection;
  try {
    doc = await getDoc<DeliveryNoteForSelection>("Delivery Note", deliveryNoteName);
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  if (doc.docstatus !== 1) {
    redirect(`/sales/delivery-notes/${encodeURIComponent(deliveryNoteName)}`);
  }

  const invoicedByRef = await getInvoicedQtyByDnDetail(deliveryNoteName);

  const rows: SelectableLineRow[] = doc.items.map((item) => ({
    reference: item.name,
    item_code: item.item_code,
    item_name: item.item_name,
    uom: item.uom,
    rate: item.rate,
    originalQty: item.qty,
    remainingQty: item.qty - (invoicedByRef[item.name] ?? 0),
  }));

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Selling", href: "/sales/delivery-notes" },
          { label: "Delivery Note", href: "/sales/delivery-notes" },
          { label: deliveryNoteName, href: `/sales/delivery-notes/${encodeURIComponent(deliveryNoteName)}` },
          { label: "Create Sales Invoice" },
        ]}
      />
      <h1 className="mb-1 text-2xl font-medium text-graphite-900">Create Sales Invoice</h1>
      <p className="mb-4 text-sm text-graphite-500">
        From Delivery Note <span className="font-mono">{deliveryNoteName}</span> — select which lines and how much of
        each to invoice now. Lines already fully invoiced are shown disabled; you can create another Sales Invoice
        later for whatever&apos;s left.
      </p>
      <LineSelectionEditor
        action={createSalesInvoiceFromDeliveryNoteAction.bind(null, deliveryNoteName)}
        rows={rows}
        currency={doc.currency}
        submitLabel="Create Sales Invoice"
        pendingLabel="Creating…"
      />
    </div>
  );
}
