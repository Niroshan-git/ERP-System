import { notFound, redirect } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { LineSelectionEditor, type SelectableLineRow } from "@/components/LineSelectionEditor";
import { ErpNextError, getDoc } from "@/lib/erpnext";
import { getBilledQtyBySoDetail } from "@/lib/fulfillment";
import { createSalesInvoiceFromSalesOrderAction } from "../../../invoices/actions";

type SalesOrderItemForSelection = {
  name: string;
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  rate: number;
};

type SalesOrderForSelection = {
  name: string;
  customer: string;
  docstatus: number;
  currency: string;
  items: SalesOrderItemForSelection[];
};

/**
 * Line-selection step in front of "Create Sales Invoice" — partial billing of a Sales
 * Order. Linked from the Sales Order detail page's Connections tab (ConnectionsPanel's
 * href-based createAction) whenever at least one line still has qty left to invoice.
 * Remaining-to-invoice per line comes from getBilledQtyBySoDetail — see that file's doc
 * comment for why it's a live computed query, not a stored field read.
 */
export default async function CreateSalesInvoiceFromSalesOrderPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const salesOrderName = decodeURIComponent(name);

  let doc: SalesOrderForSelection;
  try {
    doc = await getDoc<SalesOrderForSelection>("Sales Order", salesOrderName);
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  if (doc.docstatus !== 1) {
    redirect(`/sales/orders/${encodeURIComponent(salesOrderName)}`);
  }

  const billedByRef = await getBilledQtyBySoDetail(salesOrderName);

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
          { label: "Selling", href: "/sales/orders" },
          { label: "Sales Order", href: "/sales/orders" },
          { label: salesOrderName, href: `/sales/orders/${encodeURIComponent(salesOrderName)}` },
          { label: "Create Sales Invoice" },
        ]}
      />
      <h1 className="mb-1 text-2xl font-medium text-graphite-900">Create Sales Invoice</h1>
      <p className="mb-4 text-sm text-graphite-500">
        From Sales Order <span className="font-mono">{salesOrderName}</span> — select which lines and how much of
        each to invoice now. Lines already fully invoiced are shown disabled; you can create another Sales Invoice
        later for whatever&apos;s left.
      </p>
      <LineSelectionEditor
        action={createSalesInvoiceFromSalesOrderAction.bind(null, salesOrderName)}
        rows={rows}
        currency={doc.currency}
        submitLabel="Create Sales Invoice"
        pendingLabel="Creating…"
      />
    </div>
  );
}
