"use client";

import { useActionState, useState } from "react";

/** Every field on an existing Pick List Item row this editor needs to round-trip on save —
 * ERPNext's PUT replaces the whole `locations` child table, so every row must be sent back
 * in full (matched to its existing child row by `name`) even though only `picked_qty` is
 * actually editable here. Sourced straight off the fetched Pick List doc, no re-derivation. */
export type EditablePickListLocation = {
  name: string;
  item_code: string;
  item_name: string;
  warehouse: string;
  qty: number;
  stock_qty: number;
  uom: string;
  stock_uom: string;
  conversion_factor: number;
  picked_qty: number;
  sales_order?: string;
  sales_order_item?: string;
};

type EditorState = { error?: string } | undefined;

/**
 * Draft-only editor for a Pick List's picked quantities — item/warehouse/requested qty are
 * fixed (set when the Pick List was created from a Sales Order); only "how much was
 * actually picked" is adjustable here, capped at the requested qty. Sibling to
 * LineSelectionEditor.tsx but for editing an already-created document's own child rows
 * rather than selecting new ones.
 */
export function PickListPickedQtyEditor({
  action,
  locations,
  submitLabel = "Save",
  pendingLabel = "Saving…",
}: {
  action: (state: EditorState, formData: FormData) => Promise<EditorState>;
  locations: EditablePickListLocation[];
  submitLabel?: string;
  pendingLabel?: string;
}) {
  const [state, formAction, isPending] = useActionState<EditorState, FormData>(action, undefined);
  const [picked, setPicked] = useState<Record<string, number>>(
    Object.fromEntries(locations.map((l) => [l.name, l.picked_qty])),
  );

  function updatePicked(name: string, value: number, max: number) {
    setPicked((prev) => ({ ...prev, [name]: Math.min(Math.max(value, 0), max) }));
  }

  const payload = locations.map((l) => ({ ...l, picked_qty: picked[l.name] ?? 0 }));

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="locations" value={JSON.stringify(payload)} readOnly />
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-canvas text-graphite-500">
              <th className="px-3 py-2 font-semibold">Item</th>
              <th className="px-3 py-2 font-semibold">Warehouse</th>
              <th className="px-3 py-2 text-right font-semibold">Qty requested</th>
              <th className="px-3 py-2 text-right font-semibold">Picked qty</th>
              <th className="px-3 py-2 font-semibold">UOM</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((row) => (
              <tr key={row.name} className="border-b border-border last:border-0">
                <td className="px-3 py-2 text-graphite-900">
                  {row.item_code} — {row.item_name}
                  {row.sales_order && <div className="font-mono text-xs text-graphite-500">from {row.sales_order}</div>}
                </td>
                <td className="px-3 py-2 font-mono text-graphite-500">{row.warehouse}</td>
                <td className="px-3 py-2 text-right font-mono tabular-nums text-graphite-500">{row.qty}</td>
                <td className="px-3 py-2 text-right">
                  <input
                    type="number"
                    min="0"
                    max={row.qty}
                    step="any"
                    value={picked[row.name] ?? 0}
                    onChange={(e) => updatePicked(row.name, Number(e.target.value) || 0, row.qty)}
                    className="w-24 rounded-md border border-border px-2 py-1.5 font-mono text-sm tabular-nums focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
                  />
                </td>
                <td className="px-3 py-2 font-mono text-graphite-500">{row.uom}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-graphite-500">
        Picked qty defaults to the full requested quantity — lower it for any line that couldn&apos;t be fully picked
        from stock. Submit the Pick List once picking is confirmed; the Delivery Note is created from the picked
        quantities, not the originally requested ones.
      </p>

      {state?.error && <p className="text-sm text-alert">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90 disabled:opacity-60"
      >
        {isPending ? pendingLabel : submitLabel}
      </button>
    </form>
  );
}
