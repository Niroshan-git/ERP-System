"use client";

import { ColumnPicker } from "@/components/ColumnPicker";
import { ExportMenu } from "@/components/ExportMenu";
import { useVisibleColumns, type ColumnDef, type TableId } from "@/lib/tableColumns";

/**
 * Generic, column-driven list table with a SAP B1-style column picker — sibling to
 * MasterTable.tsx (which stays as-is for simple flat masters with no picker). Every
 * column owns its own cell rendering, so this component just resolves which columns are
 * currently visible (via useVisibleColumns) and renders the table shell around them.
 */
export function DataTable<T extends Record<string, unknown>>({
  tableId,
  columns,
  rows,
  getRowKey = (row) => String(row.name ?? ""),
  emptyLabel = "No records match these filters.",
  selectable,
  startIndex = 0,
}: {
  tableId: TableId;
  columns: ColumnDef<T>[];
  rows: T[];
  getRowKey?: (row: T) => string;
  emptyLabel?: string;
  selectable?: {
    selectedKeys: Set<string>;
    onToggleOne: (key: string) => void;
    onToggleAll: () => void;
    allSelected: boolean;
  };
  /** Absolute row number of this page's first row minus 1, i.e. `(page - 1) * pageSize` —
   * used only to number the leading "#" column continuously across pages. */
  startIndex?: number;
}) {
  const { visibleColumns, isVisible, toggleColumn } = useVisibleColumns(tableId, columns);
  const colSpan = visibleColumns.length + (selectable ? 1 : 0) + 1;

  const exportHeaders = visibleColumns.map((c) => c.label);
  const exportRows = rows.map((row) =>
    visibleColumns.map((col) => (col.exportValue ? col.exportValue(row) : String((row as Record<string, unknown>)[col.key] ?? ""))),
  );

  return (
    <div>
      <div className="mb-2 flex justify-end gap-2">
        <ColumnPicker columns={columns} isVisible={isVisible} onToggle={toggleColumn} />
        <ExportMenu
          filename={`${tableId}-${new Date().toISOString().slice(0, 10)}`}
          headers={exportHeaders}
          rows={exportRows}
        />
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-canvas text-graphite-500">
              {selectable && (
                <th className="w-10 px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={selectable.allSelected}
                    onChange={selectable.onToggleAll}
                    aria-label="Select all"
                  />
                </th>
              )}
              <th className="w-10 px-4 py-2.5 text-right font-semibold text-graphite-400">#</th>
              {visibleColumns.map((col) => (
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
            {rows.map((row, i) => {
              const key = getRowKey(row);
              return (
                <tr key={key} className="border-b border-border last:border-0 hover:bg-canvas/60">
                  {selectable && (
                    <td className="px-4 py-2.5">
                      <input
                        type="checkbox"
                        checked={selectable.selectedKeys.has(key)}
                        onChange={() => selectable.onToggleOne(key)}
                        aria-label={`Select ${key}`}
                      />
                    </td>
                  )}
                  <td className="px-4 py-2.5 text-right text-graphite-400">{startIndex + i + 1}</td>
                  {visibleColumns.map((col) => (
                    <td key={col.key} className={`px-4 py-2.5 ${col.align === "right" ? "text-right" : ""}`}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={colSpan} className="px-4 py-6 text-center text-graphite-500">
                  {emptyLabel}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
