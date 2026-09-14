"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusPill } from "@/components/StatusPill";
import { ProgressBar } from "@/components/ProgressBar";
import { salesOrderStatus } from "@/lib/erpStatus";
import type { DocStatus } from "@/lib/docStatus";

type SalesOrderRow = {
  name: string;
  customer: string;
  status: string;
  docstatus: DocStatus;
  delivery_date?: string;
  grand_total: number;
  per_delivered: number;
  per_billed: number;
};

type BulkResult = { message: string };

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
}: {
  orders: SalesOrderRow[];
  closeAction: (names: string[]) => Promise<BulkResult>;
  reopenAction: (names: string[]) => Promise<BulkResult>;
  createInvoicesAction: (names: string[]) => Promise<BulkResult>;
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

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-canvas text-graphite-500">
              <th className="w-10 px-4 py-2.5">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" />
              </th>
              <th className="px-4 py-2.5 font-semibold">Customer</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="px-4 py-2.5 font-semibold">Delivery date</th>
              <th className="px-4 py-2.5 font-semibold">Grand total</th>
              <th className="px-4 py-2.5 font-semibold">% Delivered</th>
              <th className="px-4 py-2.5 font-semibold">% Amount billed</th>
              <th className="px-4 py-2.5 font-semibold">ID</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const status = salesOrderStatus(o);
              return (
                <tr key={o.name} className="border-b border-border last:border-0 hover:bg-canvas/60">
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={selected.has(o.name)}
                      onChange={() => toggleOne(o.name)}
                      aria-label={`Select ${o.name}`}
                    />
                  </td>
                  <td className="px-4 py-2.5 text-graphite-900">{o.customer}</td>
                  <td className="px-4 py-2.5">
                    <StatusPill label={status.label} tone={status.tone} />
                  </td>
                  <td className="px-4 py-2.5 font-mono text-graphite-500">{o.delivery_date || "—"}</td>
                  <td className="px-4 py-2.5 font-mono tabular-nums text-graphite-900">{o.grand_total.toFixed(2)}</td>
                  <td className="px-4 py-2.5">
                    <ProgressBar value={o.per_delivered} />
                  </td>
                  <td className="px-4 py-2.5">
                    <ProgressBar value={o.per_billed} />
                  </td>
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/sales/orders/${encodeURIComponent(o.name)}`}
                      className="font-mono text-signal hover:underline"
                    >
                      {o.name}
                    </Link>
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-graphite-500">
                  No sales orders match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
