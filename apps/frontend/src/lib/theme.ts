import { useSyncExternalStore } from "react";

const STORAGE_KEY = "ceylonstack.theme.v1";

export type Theme = "light" | "dark";

// Module-level pub-sub over localStorage, same convention as Sidebar/ReportsList/
// tableColumns — read via useSyncExternalStore rather than useState+useEffect so the
// server-rendered default and the client's saved (or system) preference can differ
// without a hydration mismatch.
const listeners = new Set<() => void>();

function systemPrefersDark(): boolean {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}

function getSnapshot(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    // localStorage unavailable — fall through to system preference.
  }
  return systemPrefersDark() ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/** Writes the explicit choice and applies it immediately — a small inline script in the
 * root layout does the same on first paint (before hydration) to avoid a flash of the
 * wrong theme; this keeps every later toggle in sync with it. */
export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Still applies for this render even if it won't persist.
  }
  document.documentElement.setAttribute("data-theme", theme);
  listeners.forEach((l) => l());
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
