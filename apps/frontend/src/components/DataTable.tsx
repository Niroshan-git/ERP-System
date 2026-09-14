"use client";

import { ColumnPicker } from "@/components/ColumnPicker";
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
}) {
  const { visibleColumns, isVisible, toggleColumn } = useVisibleColumns(tableId, columns);
  const colSpan = visibleColumns.length + (selectable ? 1 : 0);

  return (
    <div>
      <div className="mb-2 flex justify-end">
        <ColumnPicker columns={columns} isVisible={isVisible} onToggle={toggleColumn} />
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
              {visibleColumns.map((col) => (
                <th key={col.key} className="px-4 py-2.5 font-semibold">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
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
                  {visibleColumns.map((col) => (
                    <td key={col.key} className="px-4 py-2.5">
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
