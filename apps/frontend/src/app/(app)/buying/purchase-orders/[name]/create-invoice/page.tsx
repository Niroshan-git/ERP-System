import { notFound, redirect } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { LineSelectionEditor, type SelectableLineRow } from "@/components/LineSelectionEditor";
import { ErpNextError, getDoc } from "@/lib/erpnext";
import { getBilledQtyByPoDetail } from "@/lib/fulfillment";
import { createPurchaseInvoiceFromPurchaseOrderAction } from "../../../purchase-invoices/actions";

type PurchaseOrderItemForSelection = {
  name: string;
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  rate: number;
};

type PurchaseOrderForSelection = {
  name: string;
  supplier: string;
  docstatus: number;
  currency: string;
  items: PurchaseOrderItemForSelection[];
};

/**
 * Line-selection step in front of "Create Purchase Invoice" — partial billing of a
 * Purchase Order. Remaining-to-invoice per line comes from getBilledQtyByPoDetail — see
 * that file's doc comment for why it's a live computed query, not a stored field read
 * (Purchase Order Item has no stored billed-*qty* field at all, only `billed_amt`).
 */
export default async function CreatePurchaseInvoiceFromPurchaseOrderPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const purchaseOrderName = decodeURIComponent(name);

  let doc: PurchaseOrderForSelection;
  try {
    doc = await getDoc<PurchaseOrderForSelection>("Purchase Order", purchaseOrderName);
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  if (doc.docstatus !== 1) {
    redirect(`/buying/purchase-orders/${encodeURIComponent(purchaseOrderName)}`);
  }

  const billedByRef = await getBilledQtyByPoDetail(purchaseOrderName);

  const rows: SelectableLineRow[] = doc.items.map((item) => ({
    reference: item.name,
    item_code: item.item_code,
    item_name: item.item_name,
    uom: item.uom,
    rate: item.rate,
    originalQty: item.qty,
    remainingQty: item.qty - (billedByRef[item.name] ?? 0),
  }));

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Buying", href: "/buying" },
          { label: "Purchase Order", href: "/buying/purchase-orders" },
          { label: purchaseOrderName, href: `/buying/purchase-orders/${encodeURIComponent(purchaseOrderName)}` },
          { label: "Create Purchase Invoice" },
        ]}
      />
      <h1 className="mb-1 text-2xl font-medium text-graphite-900">Create Purchase Invoice</h1>
      <p className="mb-4 text-sm text-graphite-500">
        From Purchase Order <span className="font-mono">{purchaseOrderName}</span> — select which lines and how much
        of each to invoice now. Lines already fully invoiced are shown disabled; you can create another Purchase
        Invoice later for whatever&apos;s left.
      </p>
      <LineSelectionEditor
        action={createPurchaseInvoiceFromPurchaseOrderAction.bind(null, purchaseOrderName)}
        rows={rows}
        currency={doc.currency}
        submitLabel="Create Purchase Invoice"
        pendingLabel="Creating…"
      />
    </div>
  );
}
