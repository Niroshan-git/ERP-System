"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import type { ReportCatalogEntry } from "@/lib/reports";

const STORAGE_KEY = "ceylon_reports_view";
type ViewMode = "grid" | "list";

// Module-level pub-sub over localStorage, read via useSyncExternalStore rather than
// useState+useEffect — this is exactly the "external store" case that hook exists for,
// and (unlike setState-in-an-effect) it lets the server-rendered "grid" default and the
// client's saved preference differ without a hydration mismatch.
const listeners = new Set<() => void>();

function getSnapshot(): ViewMode {
  try {
    return localStorage.getItem(STORAGE_KEY) === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
}

function getServerSnapshot(): ViewMode {
  return "grid";
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function setStoredView(mode: ViewMode) {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // localStorage unavailable (private window, blocked storage) — the click still
    // notifies listeners below, so the toggle works for this render even if it won't persist.
  }
  listeners.forEach((l) => l());
}

/** Grid vs. list toggle for the Reports hub — remembered per-browser via localStorage
 * (a viewer convenience, not data, so plain localStorage is fine here). */
export function ReportsList({ reports }: { reports: ReportCatalogEntry[] }) {
  const view = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <div>
      <div className="mb-3 flex justify-end gap-1">
        <ViewButton active={view === "grid"} label="Grid view" onClick={() => setStoredView("grid")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        </ViewButton>
        <ViewButton active={view === "list"} label="List view" onClick={() => setStoredView("list")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
        </ViewButton>
      </div>

      {view === "grid" ? <GridView reports={reports} /> : <ListView reports={reports} />}
    </div>
  );
}

function ViewButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={label}
      className={`rounded-md border p-1.5 ${
        active
          ? "border-signal bg-signal/10 text-signal"
          : "border-border text-graphite-500 hover:bg-canvas"
      }`}
    >
      {children}
    </button>
  );
}

function GridView({ reports }: { reports: ReportCatalogEntry[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {reports.map((report) => {
        const card = (
          <div
            className={`h-full rounded-xl border border-border bg-surface p-4 ${
              report.href ? "hover:border-signal/50 hover:shadow-sm" : "opacity-60"
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-graphite-900">{report.name}</h2>
              {!report.href && (
                <span className="rounded-full bg-graphite-500/10 px-2 py-0.5 text-xs font-medium text-graphite-500">
                  Coming soon
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-graphite-500">{report.description}</p>
          </div>
        );

        return report.href ? (
          <Link key={report.name} href={report.href}>
            {card}
          </Link>
        ) : (
          <div key={report.name}>{card}</div>
        );
      })}
    </div>
  );
}

function ListView({ reports }: { reports: ReportCatalogEntry[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      {reports.map((report) => {
        const row = (
          <div
            className={`flex items-center justify-between gap-4 border-b border-border px-4 py-3 last:border-0 ${
              report.href ? "hover:bg-canvas/60" : "opacity-60"
            }`}
          >
            <div className="min-w-0">
              <p className="font-medium text-graphite-900">{report.name}</p>
              <p className="truncate text-sm text-graphite-500">{report.description}</p>
            </div>
            {!report.href && (
              <span className="shrink-0 rounded-full bg-graphite-500/10 px-2 py-0.5 text-xs font-medium text-graphite-500">
                Coming soon
              </span>
            )}
          </div>
        );

        return report.href ? (
          <Link key={report.name} href={report.href} className="block">
            {row}
          </Link>
        ) : (
          <div key={report.name}>{row}</div>
        );
      })}
    </div>
  );
}
