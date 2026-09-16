import { notFound, redirect } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { LineSelectionEditor, type SelectableLineRow } from "@/components/LineSelectionEditor";
import { ErpNextError, getDoc } from "@/lib/erpnext";
import { getSellingDefaults } from "@/lib/salesDefaults";
import { createPickListFromSalesOrderAction } from "../../../pick-lists/actions";

type SalesOrderItemForSelection = {
  name: string;
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  rate: number;
  /** Real, live stored Float field on Sales Order Item — see the doc comment on
   * createPickListFromSalesOrderAction. */
  picked_qty?: number;
};

type SalesOrderForSelection = {
  name: string;
  customer: string;
  company: string;
  docstatus: number;
  currency: string;
  items: SalesOrderItemForSelection[];
};

/**
 * Line-selection step in front of "Create Pick List" — the optional picking stage between
 * a Sales Order and its Delivery Note (salesFlowMap.ts's `pick` node). Sibling to
 * create-delivery/page.tsx; remaining-to-pick per line is a simple `qty - picked_qty`
 * subtraction, same shape as delivered_qty.
 *
 * No batch/serial picker here — Pick List doesn't move stock itself (the Delivery Note
 * created from it does), so batch/serial selection stays at the Delivery Note step, same
 * as the direct Sales-Order-to-Delivery-Note path. The stock-availability badge still
 * shows per line (LineSelectionEditor renders it whenever `warehouse` is set), since
 * knowing what's actually on hand is exactly what a picking screen is for.
 */
export default async function CreatePickListFromSalesOrderPage({
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

  const defaults = await getSellingDefaults(doc.company);

  const rows: SelectableLineRow[] = doc.items.map((item) => ({
    reference: item.name,
    item_code: item.item_code,
    item_name: item.item_name,
    uom: item.uom,
    rate: item.rate,
    originalQty: item.qty,
    remainingQty: item.qty - (item.picked_qty ?? 0),
    warehouse: defaults.defaultWarehouse,
  }));

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Selling", href: "/sales/orders" },
          { label: "Sales Order", href: "/sales/orders" },
          { label: salesOrderName, href: `/sales/orders/${encodeURIComponent(salesOrderName)}` },
          { label: "Create Pick List" },
        ]}
      />
      <h1 className="mb-1 text-2xl font-medium text-graphite-900">Create Pick List</h1>
      <p className="mb-4 text-sm text-graphite-500">
        From Sales Order <span className="font-mono">{salesOrderName}</span> — select which lines and how much of
        each to release for picking now. Lines already fully picked are shown disabled; you can create another Pick
        List later for whatever&apos;s left.
      </p>
      <LineSelectionEditor
        action={createPickListFromSalesOrderAction.bind(null, salesOrderName)}
        rows={rows}
        currency={doc.currency}
        submitLabel="Create Pick List"
        pendingLabel="Creating…"
      />
    </div>
  );
}
