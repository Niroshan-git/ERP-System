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

/**
 * Masks a sensitive identifier (bank account number, IBAN) for list-view display — shows
 * only the trailing 4 characters, capping the leading mask run at 8 asterisks so a long IBAN
 * doesn't blow out a table cell. Added for FIN-1 (Bank Account) — see
 * `docs/backend/06-accounting/chart-of-accounts-bank-account.md`: the full value is only ever
 * shown on the detail/edit page, never in a list, and this function is the only place list
 * views are allowed to derive a display string from the raw field. Returns "—" for an empty
 * value so a masked-but-blank field doesn't render as a suspicious bare string of asterisks.
 */
export function maskSensitive(value: string | null | undefined): string {
  if (!value) return "—";
  const trimmed = value.trim();
  if (!trimmed) return "—";
  if (trimmed.length <= 4) return "*".repeat(trimmed.length);
  const starCount = Math.min(trimmed.length - 4, 8);
  return `${"*".repeat(starCount)}${trimmed.slice(-4)}`;
}
