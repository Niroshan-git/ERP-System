/**
 * Shared number-formatting helpers for currency/amount display. `formatAmount` is the
 * single source of truth for rendering a monetary value with thousand-group separators —
 * extracted from ReportTable.tsx's own local `formatNumber` (which the Reports hub already
 * proved correct) so every other screen that renders a Currency/amount field doesn't
 * duplicate the same logic with a plain, non-grouped `.toFixed(2)`.
 *
 * Deliberately locale-agnostic: `toLocaleString(undefined, ...)` follows the browser/server's
 * own locale rather than hard-coding one (e.g. "en-US"), matching what ReportTable.tsx already
 * does. No specific locale or decimal-place convention is documented in DESIGN.md/docs/brand.md,
 * so this generic approach is the correct one, not an invented convention.
 */
export function formatAmount(value: number | string | undefined | null): string {
  const n = typeof value === "number" ? value : Number(value);
  if (value === undefined || value === null || Number.isNaN(n)) return String(value ?? "");
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
