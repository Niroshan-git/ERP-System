import { notFound } from "next/navigation";
import "@/lib/print/renderer/print.css";
import { DocumentRenderer } from "@/lib/print/renderer/DocumentRenderer";
import { resolveDocumentPrintModel } from "@/lib/print/adapter";
import { resolveTemplate } from "@/lib/print/templateResolver";
import { DocumentOutputActions } from "@/components/DocumentOutputActions";
import { AccessDeniedNotice } from "@/components/AccessDeniedNotice";

/**
 * The reusable, chrome-free document preview surface (LP-2 §9) — lives outside the `(app)` route
 * group deliberately, so it never inherits Sidebar/Topbar (mission §10's "no unnecessary ERP
 * application chrome in print output"). Still covered by middleware.ts's session gate: the matcher
 * excludes only `/api`, `/_next/*`, `/brand`, `/favicon.ico`, so an unauthenticated request here
 * redirects to `/login` exactly like every other route in this app — no separate auth check needed
 * to be reachable at all, but this page and the sibling `pdf/route.ts` both still re-verify the
 * document itself is fetchable (via `resolveDocumentPrintModel` → `getDoc`, the same ERPNext
 * permission path every other document page in this app already goes through) rather than trusting
 * that a valid session alone means this specific document should be shown.
 *
 * `doctype` is never passed to ERPNext directly from this route param — `resolveDocumentPrintModel`
 * checks it against the adapter registry allowlist first (lib/print/adapter.ts), so an
 * unregistered doctype 404s before any ERPNext call is made (mission §11's path/parameter
 * manipulation concern).
 */
export default async function PrintPreviewPage({
  params,
}: {
  params: Promise<{ doctype: string; name: string }>;
}) {
  const { doctype: rawDoctype, name: rawName } = await params;
  const doctype = decodeURIComponent(rawDoctype);
  const name = decodeURIComponent(rawName);

  const result = await resolveDocumentPrintModel(doctype, name);
  if (!result.ok) {
    if (result.reason === "forbidden") {
      return (
        <div className="print-page">
          <AccessDeniedNotice what={`this ${doctype.toLowerCase()}`} />
        </div>
      );
    }
    notFound();
  }

  const template = resolveTemplate(doctype);

  return (
    <div className="print-page">
      <div className="print-toolbar">
        <DocumentOutputActions doctype={doctype} documentName={name} context="preview" />
      </div>
      <DocumentRenderer model={result.model} template={template} />
    </div>
  );
}
