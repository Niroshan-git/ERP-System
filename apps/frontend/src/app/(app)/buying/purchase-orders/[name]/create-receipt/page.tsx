import { notFound, redirect } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { LineSelectionEditor, type SelectableLineRow } from "@/components/LineSelectionEditor";
import { ErpNextError, getDoc } from "@/lib/erpnext";
import { createPurchaseReceiptFromPurchaseOrderAction } from "../../../purchase-receipts/actions";

type PurchaseOrderItemForSelection = {
  name: string;
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  rate: number;
  /** Real, live stored Float field on Purchase Order Item — see the doc comment on
   * createPurchaseReceiptFromPurchaseOrderAction. */
  received_qty?: number;
};

type PurchaseOrderForSelection = {
  name: string;
  supplier: string;
  docstatus: number;
  currency: string;
  items: PurchaseOrderItemForSelection[];
};

/**
 * Line-selection step in front of "Create Purchase Receipt" — partial receiving of a
 * Purchase Order. Linked from the Purchase Order detail page's Connections tab whenever at
 * least one line still has qty left to receive. Remaining-to-receive per line is a simple
 * `qty - received_qty` subtraction — a real stored field ERPNext itself maintains, no
 * live-summed query needed (mirrors /sales/orders/[name]/create-delivery's own shape).
 *
 * No batch/serial picker or defaultWarehouse-driven stock badge here — out of scope for
 * this Buying build (the plan doesn't call for it; warehouse is applied uniformly
 * server-side, see getBuyingDefaults).
 */
export default async function CreatePurchaseReceiptFromPurchaseOrderPage({
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

  const rows: SelectableLineRow[] = doc.items.map((item) => ({
    reference: item.name,
    item_code: item.item_code,
    item_name: item.item_name,
    uom: item.uom,
    rate: item.rate,
    originalQty: item.qty,
    remainingQty: item.qty - (item.received_qty ?? 0),
  }));

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Buying", href: "/buying" },
          { label: "Purchase Order", href: "/buying/purchase-orders" },
          { label: purchaseOrderName, href: `/buying/purchase-orders/${encodeURIComponent(purchaseOrderName)}` },
          { label: "Create Purchase Receipt" },
        ]}
      />
      <h1 className="mb-1 text-2xl font-medium text-graphite-900">Create Purchase Receipt</h1>
      <p className="mb-4 text-sm text-graphite-500">
        From Purchase Order <span className="font-mono">{purchaseOrderName}</span> — select which lines and how much
        of each to receive now. Lines already fully received are shown disabled; you can create another Purchase
        Receipt later for whatever&apos;s left.
      </p>
      <LineSelectionEditor
        action={createPurchaseReceiptFromPurchaseOrderAction.bind(null, purchaseOrderName)}
        rows={rows}
        currency={doc.currency}
        submitLabel="Create Purchase Receipt"
        pendingLabel="Creating…"
      />
    </div>
  );
}
