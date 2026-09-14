/**
 * Surfaces "this document was created from X" directly on the form, not just buried in the
 * Connections tab — the upstream reference is already computed by every detail page (it's
 * read straight off the doc's own items, e.g. Sales Order's `prevdoc_docname`, Delivery
 * Note's `against_sales_order`, Sales Invoice's `sales_order`/`delivery_note`), this just
 * makes it visible where a user actually looks first. A document created standalone (no
 * source) renders nothing.
 */
export function SourceDocumentBanner({
  sources,
}: {
  sources: { label: string; href: string; docs: string[] }[];
}) {
  const present = sources.filter((s) => s.docs.length > 0);
  if (present.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border border-border bg-graphite-900/[0.03] px-3 py-2 text-sm text-graphite-500">
      {present.map((s) => (
        <span key={s.label}>
          Created from {s.label}{" "}
          {s.docs.map((d, i) => (
            <span key={d}>
              {i > 0 && ", "}
              <a
                href={`${s.href}/${encodeURIComponent(d)}`}
                className="font-medium text-signal underline underline-offset-2"
              >
                {d}
              </a>
            </span>
          ))}
        </span>
      ))}
    </div>
  );
}
