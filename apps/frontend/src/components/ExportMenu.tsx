"use client";

import { useEffect, useRef, useState } from "react";
import { exportToCsv, exportToExcel, exportToPdf } from "@/lib/export";

/**
 * ERPNext-Desk-style three-dot ("⋯") export menu — mirrors ColumnPicker.tsx's exact
 * interaction pattern (open state, outside-click-closes listener, popover chrome) but
 * decoupled from any particular column type so it works for DataTable, MasterTable, and
 * ReportTable alike: callers shape their own data into flat `headers`/`rows` first.
 *
 * This exports only the rows currently rendered on screen (this frontend paginates
 * server-side, so "export everything across all pages" isn't in scope here) — matching
 * Desk's own "export what you see" list-view behavior.
 */
export function ExportMenu({
  filename,
  headers,
  rows,
  disabled,
}: {
  filename: string;
  headers: string[];
  rows: (string | number)[][];
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isDisabled = disabled || rows.length === 0;

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function handleExport(kind: "excel" | "csv" | "pdf") {
    if (kind === "excel") exportToExcel(`${filename}.xlsx`, headers, rows);
    else if (kind === "csv") exportToCsv(`${filename}.csv`, headers, rows);
    else exportToPdf(`${filename}.pdf`, headers, rows);
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => !isDisabled && setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Export"
        title="Export"
        disabled={isDisabled}
        className="flex items-center justify-center rounded-md border border-border bg-surface px-2.5 py-1.5 text-graphite-900 hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-48 rounded-md border border-border bg-surface p-1 shadow-lg">
          <button
            type="button"
            onClick={() => handleExport("excel")}
            className="block w-full rounded px-3 py-1.5 text-left text-sm text-graphite-900 hover:bg-canvas"
          >
            Export to Excel
          </button>
          <button
            type="button"
            onClick={() => handleExport("csv")}
            className="block w-full rounded px-3 py-1.5 text-left text-sm text-graphite-900 hover:bg-canvas"
          >
            Export to CSV
          </button>
          <button
            type="button"
            onClick={() => handleExport("pdf")}
            className="block w-full rounded px-3 py-1.5 text-left text-sm text-graphite-900 hover:bg-canvas"
          >
            Export to PDF
          </button>
        </div>
      )}
    </div>
  );
}
