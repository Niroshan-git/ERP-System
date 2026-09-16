import Link from "next/link";
import { ExportMenu } from "@/components/ExportMenu";

export type MasterColumn<T> = {
  key: keyof T & string;
  label: string;
  mono?: boolean;
  /** Text alignment for both this column's `<th>` and every `<td>` in it — same convention
   * as DataTable's ColumnDef.align. Omit for left (the default). */
  align?: "left" | "right";
  render?: (row: T) => React.ReactNode;
  /** Used only by ExportMenu — when `render()` shows something other than the raw field
   * value (a StatusPill, a computed value), provide this so exports show the same
   * plain-text meaning. Falls back to the raw field value when absent. */
  exportValue?: (row: T) => string | number;
};

function slugify(title: string): string {
  return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/**
 * Generic list-view table for flat/self-referencing master data doctypes
 * (Customer Group, Territory, Item Group, Price List, etc.). Mirrors the
 * table chrome established by sales/customers/page.tsx and sales/items/page.tsx —
 * keep those two doctypes' hand-rolled tables as-is; this is for the rest.
 */
export function MasterTable<T extends Record<string, unknown>>({
  title,
  rows,
  columns,
  newHref,
  rowLink,
  emptyLabel,
  startIndex = 0,
}: {
  title: string;
  rows: T[];
  columns: MasterColumn<T>[];
  newHref: string;
  rowLink: (row: T) => string;
  emptyLabel?: string;
  /** Absolute row number of this page's first row minus 1, i.e. `(page - 1) * pageSize` —
   * used only to number the leading "#" column continuously across pages. */
  startIndex?: number;
}) {
  const exportHeaders = columns.map((c) => c.label);
  const exportRows = rows.map((row) =>
    columns.map((col) => (col.exportValue ? col.exportValue(row) : String(row[col.key] ?? ""))),
  );
  const exportFilename = `${slugify(title)}-${new Date().toISOString().slice(0, 10)}`;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-medium text-graphite-900">{title}</h1>
        <div className="flex items-center gap-2">
          <ExportMenu filename={exportFilename} headers={exportHeaders} rows={exportRows} />
          <Link
            href={newHref}
            className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90"
          >
            + New
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-canvas text-graphite-500">
              <th className="w-10 px-4 py-2.5 text-right font-semibold text-graphite-400">#</th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-2.5 font-semibold ${col.align === "right" ? "text-right" : ""}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={String(row.name ?? i)} className="border-b border-border last:border-0 hover:bg-canvas/60">
                <td className="px-4 py-2.5 text-right text-graphite-400">{startIndex + i + 1}</td>
                {columns.map((col, colIdx) => {
                  const value = row[col.key];
                  const content = col.render ? col.render(row) : (value === null || value === undefined || value === "" ? "—" : String(value));
                  return (
                    <td
                      key={col.key}
                      className={`px-4 py-2.5 ${colIdx === 0 ? "" : col.mono ? "font-mono text-graphite-500" : "text-graphite-500"} ${col.align === "right" ? "text-right" : ""}`}
                    >
                      {colIdx === 0 ? (
                        <Link href={rowLink(row)} className="font-mono text-signal hover:underline">
                          {content}
                        </Link>
                      ) : (
                        content
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-6 text-center text-graphite-500">
                  {emptyLabel ?? "No records yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
