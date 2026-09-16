import { notFound, redirect } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { LineSelectionEditor, type SelectableLineRow } from "@/components/LineSelectionEditor";
import { ErpNextError, getDoc } from "@/lib/erpnext";
import { getBilledQtyByPrDetail } from "@/lib/fulfillment";
import { createPurchaseInvoiceFromPurchaseReceiptAction } from "../../../purchase-invoices/actions";

type PurchaseReceiptItemForSelection = {
  name: string;
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  rate: number;
};

type PurchaseReceiptForSelection = {
  name: string;
  supplier: string;
  docstatus: number;
  currency: string;
  items: PurchaseReceiptItemForSelection[];
};

/**
 * Line-selection step in front of "Create Purchase Invoice" — partial billing of a
 * Purchase Receipt. Remaining-to-invoice per line comes from getBilledQtyByPrDetail — see
 * that file's doc comment for why it's a live computed query (Purchase Receipt Item has no
 * stored billed-*qty* field at all, only `billed_amt` — mirrors the Delivery Note -> Sales
 * Invoice case exactly, just keyed on `pr_detail` instead of `dn_detail`).
 */
export default async function CreatePurchaseInvoiceFromPurchaseReceiptPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const purchaseReceiptName = decodeURIComponent(name);

  let doc: PurchaseReceiptForSelection;
  try {
    doc = await getDoc<PurchaseReceiptForSelection>("Purchase Receipt", purchaseReceiptName);
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  if (doc.docstatus !== 1) {
    redirect(`/buying/purchase-receipts/${encodeURIComponent(purchaseReceiptName)}`);
  }

  const billedByRef = await getBilledQtyByPrDetail(purchaseReceiptName);

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
          { label: "Purchase Receipt", href: "/buying/purchase-receipts" },
          { label: purchaseReceiptName, href: `/buying/purchase-receipts/${encodeURIComponent(purchaseReceiptName)}` },
          { label: "Create Purchase Invoice" },
        ]}
      />
      <h1 className="mb-1 text-2xl font-medium text-graphite-900">Create Purchase Invoice</h1>
      <p className="mb-4 text-sm text-graphite-500">
        From Purchase Receipt <span className="font-mono">{purchaseReceiptName}</span> — select which lines and how
        much of each to invoice now. Lines already fully invoiced are shown disabled; you can create another
        Purchase Invoice later for whatever&apos;s left.
      </p>
      <LineSelectionEditor
        action={createPurchaseInvoiceFromPurchaseReceiptAction.bind(null, purchaseReceiptName)}
        rows={rows}
        currency={doc.currency}
        submitLabel="Create Purchase Invoice"
        pendingLabel="Creating…"
      />
    </div>
  );
}
