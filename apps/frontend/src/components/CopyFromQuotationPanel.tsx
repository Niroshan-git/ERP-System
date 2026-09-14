"use client";

import { useState, useTransition } from "react";
import { LineSelectionEditor, type ConfirmedLineRow, type SelectableLineRow } from "@/components/LineSelectionEditor";
import {
  getQuotationForCopy,
  listCopyableQuotations,
  type CopyableQuotation,
  type QuotationForCopy,
} from "@/lib/actions/quotationLookup";
import type { LineRow } from "@/components/LineItemsEditor";

export type CopiedQuotationFields = {
  items: LineRow[];
  customer_address?: string;
  contact_person?: string;
  shipping_address_name?: string;
  territory?: string;
  customer_group?: string;
  tc_name?: string;
  terms?: string;
  title?: string;
};

/**
 * SAP B1-style "Copy From" on the New Sales Order page: check one or more Submitted
 * Quotations belonging to the already-selected Customer, select which lines & how much of
 * each to bring across (combined from all checked quotations into one selection step), and
 * apply it to the Sales Order form still being drafted — not an immediate ERPNext create
 * (that's the separate /sales/quotations/[name]/create-order flow, initiated from the
 * Quotation itself and untouched by this component). Unlike this panel's first version,
 * copied lines ARE now formally tagged (`quotation_item`/`source_quotation`, carried through
 * LineItemsEditor's LineRow — see that file) so saving the Sales Order sets real
 * `quotation_item`/`prevdoc_docname` on those lines, same as the dedicated create-order
 * flow: they show under the source Quotation's own Connections tab and drive its real
 * `ordered_qty`/status tracking. The necessary consequence: a copied line's qty is
 * re-validated against that Quotation line's real remaining qty at Save time, not just
 * capped once here at copy time (see orders/actions.ts's buildSalesOrderFields) — still
 * fully editable in between, but Save can now reject an over-inflated copied line.
 *
 * The caller must render this with `key={`${customer}::${company}`}` (see
 * SalesOrderForm.tsx) — that's what resets any already-loaded quotation list/selection
 * when the user changes Customer *or* Company after opening this panel, rather than
 * leaving a stale list from the old customer/company on screen. Simpler and lint-clean vs.
 * a setState-in-effect reset. Company matters here (not just Customer) because
 * listCopyableQuotations itself filters by Company — see that function's doc comment for
 * why a cross-company copy isn't just unwise but a real ERPNext save-time rejection.
 */
export function CopyFromQuotationPanel({
  customer,
  company,
  currency,
  onApply,
}: {
  customer: string;
  company: string;
  currency: string;
  onApply: (fields: CopiedQuotationFields) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [quotations, setQuotations] = useState<CopyableQuotation[] | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  /** Full detail for every checked quotation, fetched together once "Continue" is clicked —
   * null while still on the picker step, an array (possibly still loading more) once past it. */
  const [combined, setCombined] = useState<QuotationForCopy[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkedNames = quotations?.filter((q) => checked[q.name]).map((q) => q.name) ?? [];

  function open() {
    setIsOpen(true);
    setChecked({});
    setCombined(null);
    setError(null);
    startTransition(async () => {
      const list = await listCopyableQuotations(customer, company);
      setQuotations(list);
    });
  }

  function toggle(name: string) {
    setChecked((prev) => ({ ...prev, [name]: !prev[name] }));
  }

  function loadChecked() {
    setError(null);
    startTransition(async () => {
      const docs = await Promise.all(checkedNames.map((name) => getQuotationForCopy(name, company)));
      const loaded = docs.filter((d): d is QuotationForCopy => d !== null);
      if (loaded.length === 0) {
        setError("Could not load the selected quotation(s) — reload and try again.");
        return;
      }
      if (loaded.length < checkedNames.length) {
        setError("One or more selected quotations could no longer be loaded — continuing with the rest.");
      }
      setCombined(loaded);
    });
  }

  function backToPicker() {
    setCombined(null);
    setError(null);
  }

  function close() {
    setIsOpen(false);
    setQuotations(null);
    setChecked({});
    setCombined(null);
    setError(null);
  }

  function handleConfirm(rows: ConfirmedLineRow[]) {
    if (!combined || combined.length === 0) return;
    // Header fields have no single obvious source once more than one quotation is checked —
    // best-effort prefill from the first checked one, same reasoning as the single-quotation
    // case before this. Still fully editable afterward either way.
    const primary = combined[0];
    onApply({
      // `reference`/`sourceLabel` here are the real Quotation Item row name and the source
      // Quotation's own name (see combinedRows below) — tagging each copied line so ERPNext's
      // real ordered_qty/Connections-tab tracking applies on save, same as the dedicated
      // create-order flow. LineItemsEditor clears this tag if the user swaps the item; the
      // server re-validates remaining qty at save time regardless (see orders/actions.ts).
      items: rows.map((r) => ({
        item_code: r.item_code,
        item_name: r.item_name,
        qty: r.qty,
        uom: r.uom,
        rate: r.rate,
        quotation_item: r.reference,
        source_quotation: r.sourceLabel,
      })),
      customer_address: primary.customer_address,
      contact_person: primary.contact_person,
      shipping_address_name: primary.shipping_address_name,
      territory: primary.territory,
      customer_group: primary.customer_group,
      tc_name: primary.tc_name,
      terms: primary.terms,
      title: primary.title,
    });
    close();
  }

  if (!customer || !company) return null;

  // Rows from every checked quotation, concatenated — same item code appearing more than
  // once (from different quotations, possibly at different rates) is expected, not merged.
  const combinedRows: SelectableLineRow[] =
    combined?.flatMap((doc) => doc.rows.map((row) => ({ ...row, sourceLabel: doc.name }))) ?? [];

  return (
    <div>
      <button
        type="button"
        onClick={open}
        className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-signal hover:bg-signal/10"
      >
        Copy From Quotation
      </button>

      {isOpen && (
        <div className="mt-3 rounded-xl border border-border bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-graphite-900">
              {combined ? (
                <>
                  Copy From {combined.length === 1 ? "Quotation" : `${combined.length} Quotations`}
                  {combined.length === 1 && <span className="font-mono"> {combined[0].name}</span>}
                </>
              ) : (
                "Copy From Quotation"
              )}
            </p>
            <button type="button" onClick={close} className="text-xs text-graphite-500 hover:underline">
              Close
            </button>
          </div>

          {!combined && quotations === null && (
            <p className="text-sm text-graphite-500">{isPending ? "Loading…" : "Nothing to show."}</p>
          )}

          {!combined && quotations !== null && (
            <>
              {quotations.length === 0 ? (
                <p className="text-sm text-graphite-500">
                  {customer} has no Submitted quotations with anything left to order.
                </p>
              ) : (
                <>
                  <ul className="space-y-1.5">
                    {quotations.map((q) => (
                      <li key={q.name}>
                        <label className="flex w-full cursor-pointer items-center gap-2.5 rounded-md border border-border px-3 py-2 text-left text-sm hover:border-signal hover:bg-signal/5 has-[:checked]:border-signal has-[:checked]:bg-signal/5">
                          <input
                            type="checkbox"
                            checked={Boolean(checked[q.name])}
                            onChange={() => toggle(q.name)}
                            disabled={isPending}
                            className="h-4 w-4 accent-signal"
                          />
                          <span>
                            <span className="font-mono">{q.name}</span>
                            <span className="text-graphite-500"> · {q.transaction_date} · {q.status} · </span>
                            <span className="font-mono">
                              {q.grand_total.toFixed(2)} {currency}
                            </span>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={loadChecked}
                    disabled={isPending || checkedNames.length === 0}
                    className="mt-3 rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90 disabled:opacity-60"
                  >
                    {isPending
                      ? "Loading…"
                      : `Continue with ${checkedNames.length} quotation${checkedNames.length === 1 ? "" : "s"}`}
                  </button>
                </>
              )}
            </>
          )}

          {combined && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs text-graphite-500">Select lines & quantities from all checked quotations, then apply.</p>
                <button type="button" onClick={backToPicker} className="text-xs text-signal hover:underline">
                  Back
                </button>
              </div>
              <LineSelectionEditor
                // Forces a remount whenever the actual set of loaded quotations changes (e.g.
                // Back -> re-check a different combination -> Continue again) — LineSelectionEditor
                // seeds its qty state from `rows` only on first mount, same reason SalesOrderForm
                // keys LineItemsEditor by copyVersion.
                key={combined.map((d) => d.name).join(",")}
                mode="confirm"
                rows={combinedRows}
                currency={currency}
                submitLabel="Apply to this Sales Order"
                onConfirm={handleConfirm}
              />
            </div>
          )}

          {error && <p className="mt-2 text-sm text-alert">{error}</p>}
        </div>
      )}
    </div>
  );
}
