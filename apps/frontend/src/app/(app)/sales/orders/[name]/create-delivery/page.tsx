import { notFound, redirect } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { LineSelectionEditor, type SelectableLineRow } from "@/components/LineSelectionEditor";
import { ErpNextError, getDoc, listDocs } from "@/lib/erpnext";
import { getSellingDefaults } from "@/lib/salesDefaults";
import { createDeliveryNoteFromSalesOrderAction } from "../../../delivery-notes/actions";

type SalesOrderItemForSelection = {
  name: string;
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  rate: number;
  /** Real, live stored Float field on Sales Order Item — see the doc comment on
   * createDeliveryNoteFromSalesOrderAction. */
  delivered_qty?: number;
  /** Real Sales Order Item field (confirmed via docs/backend/02-sales/sales-order.md's
   * canonical mapping — "Target fulfillment warehouse. Per-line or default") — used as the
   * row's starting warehouse selection (SALES-DN-WH-1 / D9 fix) so a real per-line warehouse
   * carries forward when one was set, before falling back to the company default below. */
  warehouse?: string;
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
 * Line-selection step in front of "Create Delivery Note" — partial fulfillment of a Sales
 * Order. Linked from the Sales Order detail page's Connections tab (ConnectionsPanel's
 * href-based createAction) whenever at least one line still has qty left to deliver.
 * Remaining-to-deliver per line is a simple `qty - delivered_qty` subtraction — unlike the
 * billed-qty case, `delivered_qty` is a real stored field ERPNext itself maintains
 * (confirmed via the live DocType JSON), no live-summed query needed.
 */
export default async function CreateDeliveryNoteFromSalesOrderPage({
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

  // Item's own batch/serial flags (not Sales Order Item fields) plus the company's default
  // warehouse — both resolved server-side so LineSelectionEditor knows, per line, whether
  // to show the BatchSerialPicker/live stock badge (Phase 2C/2D; Delivery Note is the only
  // doctype in this app that actually moves stock).
  const [defaults, itemFlags] = await Promise.all([
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
    remainingQty: item.qty - (item.delivered_qty ?? 0),
    warehouse: item.warehouse || defaults.defaultWarehouse,
    has_batch_no: Boolean(flagsByItem[item.item_code]?.has_batch_no),
    has_serial_no: Boolean(flagsByItem[item.item_code]?.has_serial_no),
  }));

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Selling", href: "/sales/orders" },
          { label: "Sales Order", href: "/sales/orders" },
          { label: salesOrderName, href: `/sales/orders/${encodeURIComponent(salesOrderName)}` },
          { label: "Create Delivery Note" },
        ]}
      />
      <h1 className="mb-1 text-2xl font-medium text-graphite-900">Create Delivery Note</h1>
      <p className="mb-4 text-sm text-graphite-500">
        From Sales Order <span className="font-mono">{salesOrderName}</span> — select which lines, how much of
        each to deliver now, and which warehouse to deliver from. Lines already fully delivered are shown disabled;
        you can create another Delivery Note later for whatever&apos;s left.
      </p>
      <LineSelectionEditor
        action={createDeliveryNoteFromSalesOrderAction.bind(null, salesOrderName)}
        rows={rows}
        currency={doc.currency}
        submitLabel="Create Delivery Note"
        pendingLabel="Creating…"
        warehouseOptions={defaults.warehouses}
      />
    </div>
  );
}
