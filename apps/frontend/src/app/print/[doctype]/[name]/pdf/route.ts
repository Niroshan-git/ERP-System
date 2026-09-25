import { NextResponse } from "next/server";
import { ErpNextError, getPrintPdf } from "@/lib/erpnext";
import { resolveDocumentPrintModel } from "@/lib/print/adapter";

/**
 * PDF download endpoint (LP-2 §10). A Route Handler, not a page — but still inside
 * middleware.ts's protected matcher (only `/api`, `/_next/*`, `/brand`, `/favicon.ico` are
 * excluded), so an unauthenticated request 404s via middleware's redirect-to-login before this
 * code ever runs. Placed at `app/print/**` specifically, not `app/api/**`, for that reason — an
 * `/api` route would fall outside middleware's session gate entirely (mission §11: "PDF endpoint
 * exposure" is exactly the risk this route placement avoids).
 *
 * Deliberately not a generic ERPNext PDF proxy: `resolveDocumentPrintModel` runs first and does
 * two things a naive `?doctype=&name=` passthrough would skip — (1) rejects any doctype not in the
 * adapter registry allowlist before ERPNext is ever called, (2) re-confirms the document is
 * actually fetchable (same permission path every other document page in this app uses) rather than
 * handing an arbitrary name straight to ERPNext's PDF generator. The resolved model itself is
 * discarded here — this route only needs to know the fetch succeeded, not its content — but running
 * the full resolution (not just a lighter existence check) means the PDF path can never diverge
 * from what the HTML preview would show for the same document.
 *
 * `LP-UNV-001`/`LP-UNV-002` (see `docs/backend/17-layout-print/layout-print-architecture.md` §2.7):
 * no explicit `format` is passed to `getPrintPdf`, so Frappe renders with its own default Print
 * Format for the doctype (one of the 7 standard Sales Invoice formats already on this instance) —
 * not yet the Ceylon Stack Standard template, which LP-3 has not authored as a Jinja Print Format.
 * Known, disclosed V1 gap: the downloaded PDF will not visually match this same document's HTML
 * preview until LP-3 ships that format.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ doctype: string; name: string }> }) {
  const { doctype: rawDoctype, name: rawName } = await params;
  const doctype = decodeURIComponent(rawDoctype);
  const name = decodeURIComponent(rawName);

  const result = await resolveDocumentPrintModel(doctype, name);
  if (!result.ok) {
    const status = result.reason === "forbidden" ? 403 : 404;
    return NextResponse.json({ error: result.reason }, { status });
  }

  try {
    const pdf = await getPrintPdf(doctype, name);
    return new NextResponse(pdf.bytes, {
      headers: {
        "Content-Type": pdf.contentType,
        "Content-Disposition": `inline; filename="${name.replace(/[^\w.-]/g, "_")}.pdf"`,
      },
    });
  } catch (e) {
    if (e instanceof ErpNextError) {
      return NextResponse.json({ error: "pdf_generation_failed" }, { status: e.status || 502 });
    }
    throw e;
  }
}
