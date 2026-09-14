import type { ReactNode } from "react";
import Link from "next/link";
import type { ReportColumn, ReportRow } from "@/lib/erpnext";

/** Doctypes this frontend has its own detail page for — Link-fieldtype columns pointing
 * at one of these render as real internal links instead of plain text. */
const INTERNAL_ROUTES: Record<string, string> = {
  "Sales Order": "/sales/orders",
  "Sales Invoice": "/sales/invoices",
  Quotation: "/sales/quotations",
  Customer: "/sales/customers",
  Item: "/sales/items",
};

const NUMERIC_TYPES = new Set(["Currency", "Float", "Int", "Percent"]);

function cellValue(row: ReportRow, col: ReportColumn, idx: number): unknown {
  return Array.isArray(row) ? row[idx] : row[col.fieldname];
}

function formatNumber(value: unknown): string {
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return String(value ?? "");
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Renders whatever `columns`/`result` ERPNext's own `frappe.desk.query_report.run`
 * returns — deliberately generic (not hand-built per report) since these reports have
 * dynamic columns that vary with real data (e.g. Sales Register adds one column per
 * income account/tax account that actually appears in the filtered invoices).
 *
 * A report's own explicit total row (e.g. Sales Analytics's periodic "Total" row) comes
 * back as a plain array instead of a keyed object — rendered bold via `Array.isArray`.
 * When no such row is present, a grand-total footer is computed client-side over numeric
 * columns, matching the footer Desk's report view adds itself.
 */
export function ReportTable({ columns, result }: { columns: ReportColumn[]; result: ReportRow[] }) {
  if (result.length === 0) {
    return <p className="rounded-xl border border-border bg-surface px-4 py-6 text-center text-graphite-500">No records for these filters.</p>;
  }

  const hasOwnTotalRow = result.some((r) => Array.isArray(r));
  const totals: Record<string, number> = {};
  if (!hasOwnTotalRow) {
    for (const col of columns) {
      if (!NUMERIC_TYPES.has(col.fieldtype ?? "")) continue;
      totals[col.fieldname] = result.reduce((sum, row) => {
        const v = (row as Record<string, unknown>)[col.fieldname];
        const n = typeof v === "number" ? v : Number(v);
        return sum + (Number.isNaN(n) ? 0 : n);
      }, 0);
    }
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-canvas text-graphite-500">
            {columns.map((col) => (
              <th key={col.fieldname} className="whitespace-nowrap px-3 py-2.5 font-semibold">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.map((row, rowIdx) => {
            const isTotalRow = Array.isArray(row);
            return (
              <tr
                key={rowIdx}
                className={`border-b border-border last:border-0 ${isTotalRow ? "bg-canvas font-semibold text-graphite-900" : "hover:bg-canvas/60"}`}
              >
                {columns.map((col, colIdx) => {
                  const value = cellValue(row, col, colIdx);
                  const isNumeric = NUMERIC_TYPES.has(col.fieldtype ?? "");
                  const route = col.fieldtype === "Link" && col.options ? INTERNAL_ROUTES[col.options] : undefined;

                  let content: ReactNode;
                  if (value === null || value === undefined || value === "") {
                    content = "—";
                  } else if (isNumeric) {
                    content = formatNumber(value);
                  } else if (route && typeof value === "string") {
                    content = (
                      <Link href={`${route}/${encodeURIComponent(value)}`} className="text-signal hover:underline">
                        {value}
                      </Link>
                    );
                  } else {
                    content = String(value);
                  }

                  return (
                    <td
                      key={col.fieldname}
                      className={`whitespace-nowrap px-3 py-2 ${isNumeric ? "font-mono tabular-nums text-graphite-900" : "text-graphite-900"}`}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {!hasOwnTotalRow && (
            <tr className="bg-canvas font-semibold text-graphite-900">
              {columns.map((col, idx) => (
                <td key={col.fieldname} className="whitespace-nowrap px-3 py-2 font-mono tabular-nums">
                  {idx === 0 ? "Total" : col.fieldname in totals ? formatNumber(totals[col.fieldname]) : ""}
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
