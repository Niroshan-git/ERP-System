"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/DataTable";
import { StatusPill } from "@/components/StatusPill";
import { ProgressBar } from "@/components/ProgressBar";
import { salesOrderStatus } from "@/lib/erpStatus";
import type { ColumnDef } from "@/lib/tableColumns";
import type { DocStatus } from "@/lib/docStatus";

export type SalesOrderRow = {
  name: string;
  customer: string;
  status: string;
  docstatus: DocStatus;
  delivery_date?: string;
  grand_total: number;
  per_delivered: number;
  per_billed: number;
  transaction_date?: string;
  company?: string;
  currency?: string;
  territory?: string;
  owner?: string;
};

type BulkResult = { message: string };

const columns: ColumnDef<SalesOrderRow>[] = [
  { key: "customer", label: "Customer", core: true, render: (o) => <span className="text-graphite-900">{o.customer}</span> },
  {
    key: "status",
    label: "Status",
    core: true,
    render: (o) => {
      const status = salesOrderStatus(o);
      return <StatusPill label={status.label} tone={status.tone} />;
    },
    exportValue: (o) => salesOrderStatus(o).label,
  },
  {
    key: "delivery_date",
    label: "Delivery date",
    render: (o) => <span className="font-mono text-graphite-500">{o.delivery_date || "—"}</span>,
  },
  {
    key: "grand_total",
    label: "Grand total",
    render: (o) => <span className="font-mono tabular-nums text-graphite-900">{o.grand_total.toFixed(2)}</span>,
  },
  { key: "per_delivered", label: "% Delivered", render: (o) => <ProgressBar value={o.per_delivered} /> },
  { key: "per_billed", label: "% Amount billed", render: (o) => <ProgressBar value={o.per_billed} /> },
  {
    key: "name",
    label: "ID",
    core: true,
    render: (o) => (
      <Link href={`/sales/orders/${encodeURIComponent(o.name)}`} className="font-mono text-signal hover:underline">
        {o.name}
      </Link>
    ),
  },
  { key: "transaction_date", label: "Date", defaultVisible: false, render: (o) => <span className="font-mono text-graphite-500">{o.transaction_date || "—"}</span> },
  { key: "company", label: "Company", defaultVisible: false, render: (o) => o.company || "—" },
  { key: "currency", label: "Currency", defaultVisible: false, render: (o) => o.currency || "—" },
  { key: "territory", label: "Territory", defaultVisible: false, render: (o) => o.territory || "—" },
  { key: "owner", label: "Owner", defaultVisible: false, render: (o) => o.owner || "—" },
];

/**
 * Row-selection + bulk "Actions" menu on the Sales Order list — ERPNext's own list view
 * only shows this once you tick a checkbox (`sales_order_list.js`'s `onload`, read on the
 * live server: `listview.page.add_action_item("Close"/"Re-open"/"Sales Invoice", ...)`).
 * The rest of that menu ("Delivery Note", "Advance Payment") isn't offered here — this
 * frontend has no Delivery Note or Payment Entry doctype support at all yet, so there'd be
 * nowhere for that action to land; see the "Known future scope" note in
 * apps/frontend/README.md-adjacent memory for why.
 */
export function SalesOrderBulkTable({
  orders,
  closeAction,
  reopenAction,
  createInvoicesAction,
  startIndex,
}: {
  orders: SalesOrderRow[];
  closeAction: (names: string[]) => Promise<BulkResult>;
  reopenAction: (names: string[]) => Promise<BulkResult>;
  createInvoicesAction: (names: string[]) => Promise<BulkResult>;
  startIndex?: number;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const allSelected = orders.length > 0 && selected.size === orders.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(orders.map((o) => o.name)));
  }

  function toggleOne(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function runBulk(action: (names: string[]) => Promise<BulkResult>) {
    const names = Array.from(selected);
    startTransition(async () => {
      const result = await action(names);
      setMessage(result.message);
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <div>
      {selected.size > 0 && (
        <div className="mb-3 flex items-center gap-3 rounded-md border border-border bg-canvas px-3 py-2 text-sm">
          <span className="font-medium text-graphite-900">{selected.size} selected</span>
          <button
            type="button"
            disabled={isPending}
            onClick={() => runBulk(closeAction)}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-graphite-900 hover:bg-surface disabled:opacity-60"
          >
            Close
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => runBulk(reopenAction)}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-graphite-900 hover:bg-surface disabled:opacity-60"
          >
            Re-open
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => runBulk(createInvoicesAction)}
            className="rounded-md bg-signal px-3 py-1.5 text-sm font-medium text-white hover:bg-signal/90 disabled:opacity-60"
          >
            {isPending ? "Working…" : "Create Sales Invoice"}
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="ml-auto text-graphite-500 hover:underline"
          >
            Clear
          </button>
        </div>
      )}
      {message && (
        <div className="mb-3 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          {message}
        </div>
      )}

      <DataTable
        tableId="orders"
        columns={columns}
        rows={orders}
        emptyLabel="No sales orders match these filters."
        selectable={{
          selectedKeys: selected,
          onToggleOne: toggleOne,
          onToggleAll: toggleAll,
          allSelected,
        }}
        startIndex={startIndex}
      />
    </div>
  );
}
