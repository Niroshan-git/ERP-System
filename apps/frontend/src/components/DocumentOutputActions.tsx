"use client";

/**
 * Reusable Preview/Print/Download PDF action row (LP-2 §8 mission sketch) — one component every
 * printable document type shares, instead of a bespoke print button per document page. Doctype is
 * validated against the print-engine's adapter registry server-side (lib/print/adapter.ts) on
 * every route this component links to; passing an unregistered doctype here just produces a link
 * that 404s, not a security boundary in itself.
 *
 * `context="preview"` is for use on the chrome-free preview surface itself (app/print/**) — real
 * `window.print()` only ever runs there, never on a normal transaction detail page (mission §10's
 * explicit "avoid simply calling window.print() on the normal transaction page"). `context="list"`
 * (default) is for use on an ordinary document page: both actions just navigate to the preview
 * surface, one of them straight into a PDF response.
 */
export function DocumentOutputActions({
  doctype,
  documentName,
  context = "list",
}: {
  doctype: string;
  documentName: string;
  context?: "list" | "preview";
}) {
  const base = `/print/${encodeURIComponent(doctype)}/${encodeURIComponent(documentName)}`;
  const buttonClass =
    "rounded-md border border-border px-3 py-1.5 text-sm font-medium text-graphite-900 hover:bg-canvas";

  if (context === "preview") {
    return (
      <div className="flex items-center gap-2">
        <button type="button" className={buttonClass} onClick={() => window.print()}>
          Print
        </button>
        <a className={buttonClass} href={`${base}/pdf`}>
          Download PDF
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <a className={buttonClass} href={base} target="_blank" rel="noreferrer">
        Preview
      </a>
      <a className={buttonClass} href={`${base}/pdf`}>
        Download PDF
      </a>
    </div>
  );
}
