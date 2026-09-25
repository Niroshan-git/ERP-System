import "server-only";
import { ErpNextError } from "@/lib/erpnext";
import { resolveTemplate } from "./templateResolver";
import { salesInvoiceAdapter } from "./adapters/salesInvoiceAdapter";
import type { DocumentPrintAdapter, DocumentPrintModel } from "./types";

export type { DocumentPrintAdapter };

/**
 * Registry, not a giant if/doctype-else chain (mission §4's explicit anti-pattern). Adding a new
 * document family in a future LP-4x package means adding one entry here, not touching this file's
 * logic. This is also the authorization allowlist for every print/PDF/preview surface (§11) — a
 * doctype absent from this map is never reachable through the print engine, regardless of what a
 * caller puts in a URL.
 */
const registry: Record<string, DocumentPrintAdapter<never>> = {
  [salesInvoiceAdapter.doctype]: salesInvoiceAdapter as DocumentPrintAdapter<never>,
};

export function getPrintAdapter(doctype: string): DocumentPrintAdapter | undefined {
  return registry[doctype];
}

export function listPrintableDoctypes(): string[] {
  return Object.keys(registry);
}

export type ResolveDocumentPrintModelResult =
  | { ok: true; model: DocumentPrintModel }
  | { ok: false; reason: "unsupported_doctype" }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "forbidden" };

/**
 * The one orchestration entry point every print/preview/PDF surface should call — never
 * `getPrintAdapter(...).fetch(...)` directly from a route/page. Centralizes the allowlist check
 * and ERPNext 404/403 mapping so no call site can accidentally skip either (mission §11's "never
 * expose arbitrary backend PDF generation through an unsafe generic proxy").
 */
export async function resolveDocumentPrintModel(
  doctype: string,
  name: string,
): Promise<ResolveDocumentPrintModelResult> {
  const adapter = getPrintAdapter(doctype);
  if (!adapter) return { ok: false, reason: "unsupported_doctype" };

  try {
    const raw = await adapter.fetch(name);
    const normalized = adapter.normalize(raw);
    const template = resolveTemplate(doctype);
    const model: DocumentPrintModel = {
      ...normalized,
      metadata: { doctype, templateId: template.id },
    };
    return { ok: true, model };
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) return { ok: false, reason: "not_found" };
    if (e instanceof ErpNextError && e.status === 403) return { ok: false, reason: "forbidden" };
    throw e;
  }
}
