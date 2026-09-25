"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ExportMenu } from "@/components/ExportMenu";
import type { ReportColumn, ReportRow } from "@/lib/erpnext";
import { formatAmount } from "@/lib/format";

/** Doctypes this frontend has its own detail page for — Link-fieldtype columns pointing
 * at one of these render as real internal links instead of plain text. */
const INTERNAL_ROUTES: Record<string, string> = {
  "Sales Order": "/sales/orders",
  "Sales Invoice": "/sales/invoices",
  Quotation: "/sales/quotations",
  Customer: "/master-data/customers",
  Item: "/master-data/items",
};

const NUMERIC_TYPES = new Set(["Currency", "Float", "Int", "Percent"]);

function cellValue(row: ReportRow, col: ReportColumn, idx: number): unknown {
  return Array.isArray(row) ? row[idx] : row[col.fieldname];
}

/**
 * Renders whatever `columns`/`result` ERPNext's own `frappe.desk.query_report.run`
 * returns — deliberately generic (not hand-built per report) since these reports have
 * dynamic columns that vary with real data (e.g. Sales Register adds one column per
 * income account/tax account that actually appears in the filtered invoices).
 *
 * A report's own explicit total row (for example, Sales Analytics's periodic "Total"
 * row) is returned by ERPNext and rendered bold. This component never invents a footer:
 * numeric does not mean additive (rates, balances, percentages and averages are common
 * counterexamples). ERPNext remains the only source of report totals.
 */
export function ReportTable({
  columns,
  result,
  reportName = "report",
}: {
  columns: ReportColumn[];
  result: ReportRow[];
  /** Threaded into the export filename — defaults to a generic "report" for any call site
   * that doesn't pass one. */
  reportName?: string;
}) {
  if (result.length === 0) {
    return <p className="rounded-xl border border-border bg-surface px-4 py-6 text-center text-graphite-500">No records for these filters.</p>;
  }

  const exportHeaders = columns.map((c) => c.label);
  const exportRows = result
    .filter((r) => !Array.isArray(r))
    .map((row) =>
      columns.map((col, idx) => {
        const v = cellValue(row, col, idx);
        return v === null || v === undefined ? "" : (v as string | number);
      }),
    );
  const exportFilename = `${reportName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${new Date()
    .toISOString()
    .slice(0, 10)}`;

  return (
    <div>
      <div className="mb-2 flex justify-end">
        <ExportMenu filename={exportFilename} headers={exportHeaders} rows={exportRows} />
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-canvas text-graphite-500">
              {columns.map((col) => (
                <th
                  key={col.fieldname}
                  className={`whitespace-nowrap px-3 py-2.5 font-semibold ${NUMERIC_TYPES.has(col.fieldtype ?? "") ? "text-right" : ""}`}
                >
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
                      content = formatAmount(value as number | string);
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
                        className={`whitespace-nowrap px-3 py-2 ${isNumeric ? "text-right font-mono tabular-nums text-graphite-900" : "text-graphite-900"}`}
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
