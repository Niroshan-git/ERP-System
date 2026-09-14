import Link from "next/link";

export type MasterColumn<T> = {
  key: keyof T & string;
  label: string;
  mono?: boolean;
  render?: (row: T) => React.ReactNode;
};

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
}: {
  title: string;
  rows: T[];
  columns: MasterColumn<T>[];
  newHref: string;
  rowLink: (row: T) => string;
  emptyLabel?: string;
}) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-medium text-graphite-900">{title}</h1>
        <Link
          href={newHref}
          className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90"
        >
          + New
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-canvas text-graphite-500">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-2.5 font-semibold">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={String(row.name ?? i)} className="border-b border-border last:border-0 hover:bg-canvas/60">
                {columns.map((col, colIdx) => {
                  const value = row[col.key];
                  const content = col.render ? col.render(row) : (value === null || value === undefined || value === "" ? "—" : String(value));
                  return (
                    <td
                      key={col.key}
                      className={`px-4 py-2.5 ${colIdx === 0 ? "" : col.mono ? "font-mono text-graphite-500" : "text-graphite-500"}`}
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
                <td colSpan={columns.length} className="px-4 py-6 text-center text-graphite-500">
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
