/**
 * Confirms a save actually happened. Update actions redirect to the same page they
 * started on (e.g. `/sales/invoices/ACC-SINV-2026-00001`) — without this, a successful
 * save and a no-op page reload look identical, which is exactly what got reported as
 * "the save button just refreshes the page."
 */
export function SavedBanner({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="mb-4 rounded-md border border-success/30 bg-success/10 px-4 py-2 text-sm font-medium text-success">
      Saved.
    </div>
  );
}
