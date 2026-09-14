"use client";

import { useEffect, useRef, useState } from "react";
import type { ColumnDef } from "@/lib/tableColumns";

/**
 * SAP B1-style "which columns are shown" popover for `DataTable`. Core columns are
 * listed too (checked, disabled) so the picker shows the full picture of what the table
 * can display, matching how SAP B1's own field chooser always lists the pinned columns
 * alongside the optional ones rather than hiding them.
 */
export function ColumnPicker<T>({
  columns,
  isVisible,
  onToggle,
}: {
  columns: ColumnDef<T>[];
  isVisible: (key: string) => boolean;
  onToggle: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (columns.every((c) => c.core)) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-graphite-900 hover:bg-canvas"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="9" y1="3" x2="9" y2="21" />
          <line x1="15" y1="3" x2="15" y2="21" />
        </svg>
        Columns
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-56 rounded-md border border-border bg-surface p-2 shadow-lg">
          <p className="mb-1 px-2 text-xs font-medium text-graphite-500">Show columns</p>
          <div className="max-h-72 overflow-y-auto">
            {columns.map((col) => {
              const checked = col.core || isVisible(col.key);
              return (
                <label
                  key={col.key}
                  className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm ${
                    col.core ? "text-graphite-500" : "cursor-pointer text-graphite-900 hover:bg-canvas"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={col.core}
                    onChange={() => !col.core && onToggle(col.key)}
                  />
                  {col.label}
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
