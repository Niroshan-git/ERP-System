import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { resolveDocumentHref } from "@/lib/observabilityCenter/documentRoutes";

/**
 * Mission §21: "If no safe canonical route exists: display the document identity
 * without a fake link" — `resolveDocumentHref()` returns `null` for any doctype this app
 * has no real detail page for, and this component only renders a `Link` when it doesn't.
 */
export function RelatedDocumentLink({ doctype, name }: { doctype: string; name: string }) {
  const href = resolveDocumentHref(doctype, name);

  if (!href) {
    return (
      <span className="text-sm text-graphite-900">
        <span className="font-mono">{name}</span>
        <span className="ml-1.5 text-graphite-500">({doctype})</span>
      </span>
    );
  }

  return (
    <Link href={href} className="inline-flex items-center gap-1 text-sm text-signal hover:underline">
      <span>
        Open {doctype} <span className="font-mono">{name}</span>
      </span>
      <ExternalLink size={12} />
    </Link>
  );
}
