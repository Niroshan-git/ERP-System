import { useSyncExternalStore, type ReactNode } from "react";

/**
 * Generic column definition for `DataTable` — every column owns its own cell rendering
 * (currency formatting, status pills, links, dashes for empty values), the same way the
 * hand-rolled tables these replace already worked column-by-column, just factored out so
 * `useVisibleColumns` can decide which ones to actually render.
 */
export type ColumnDef<T> = {
  key: string;
  label: string;
  /** Always shown, never appears as a togglable row in the column picker. */
  core?: boolean;
  /** For non-core columns: whether it's on by default the first time this table is opened
   * in a browser that has no saved preference yet. Defaults to true. */
  defaultVisible?: boolean;
  render: (row: T) => ReactNode;
};

export type TableId = "quotations" | "orders" | "delivery-notes" | "invoices" | "customers" | "items";

const STORAGE_KEY = "ceylonstack.columns.v1";

type StoredState = Record<string, string[]>;

// Same module-level pub-sub-over-localStorage convention already established by
// Sidebar.tsx/ReportsList.tsx — a raw-string memoization layer so repeated snapshot reads
// don't re-parse JSON every render, invalidated by clearing `cachedRaw` after each write.
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedState: StoredState = {};

function readState(): StoredState {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return {};
  }
  if (raw === cachedRaw) return cachedState;
  cachedRaw = raw;
  try {
    cachedState = raw ? (JSON.parse(raw) as StoredState) : {};
  } catch {
    cachedState = {};
  }
  return cachedState;
}

function getServerSnapshot(): StoredState {
  return {};
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function writeState(tableId: TableId, visibleOptionalKeys: string[]) {
  const next = { ...readState(), [tableId]: visibleOptionalKeys };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable (private window, blocked storage) — the toggle still
    // notifies listeners below, so it works for this render even if it won't persist.
  }
  cachedRaw = undefined;
  listeners.forEach((l) => l());
}

function defaultVisibleKeys<T>(columns: ColumnDef<T>[]): string[] {
  return columns.filter((c) => !c.core && c.defaultVisible !== false).map((c) => c.key);
}

/**
 * Resolves which columns should render for one table: every `core` column, plus whichever
 * optional columns are toggled on — read from `useSyncExternalStore` (not useState+effect)
 * so the client's saved preference and the server-rendered default can differ without a
 * hydration mismatch, same reasoning as ReportsList's view-mode toggle.
 */
export function useVisibleColumns<T>(tableId: TableId, columns: ColumnDef<T>[]) {
  const state = useSyncExternalStore(subscribe, readState, getServerSnapshot);
  const storedKeys = state[tableId];
  const visibleKeys = new Set(storedKeys ?? defaultVisibleKeys(columns));

  function toggleColumn(key: string) {
    const current = new Set(storedKeys ?? defaultVisibleKeys(columns));
    if (current.has(key)) current.delete(key);
    else current.add(key);
    writeState(tableId, Array.from(current));
  }

  const visibleColumns = columns.filter((c) => c.core || visibleKeys.has(c.key));
  const isVisible = (key: string) => visibleKeys.has(key);

  return { visibleColumns, isVisible, toggleColumn };
}
