# Layout, Print & Document Output Engine — Domain Overview

**Status:** `LP-0`/`LP-1` discovery/architecture, `LP-2` (Canonical Document Output Engine) shipped
2026-09-25. A real engine now exists — canonical model, one adapter (Sales Invoice), template
resolver, rendering shell, preview + PDF routes — but it is **not wired into any real document
page** yet (`sales/invoices/[name]/page.tsx` is untouched; `LP-4A` owns that). `apps/frontend`'s
older "export" surface (`ExportMenu.tsx`/`lib/export.ts`) is a separate, unrelated client-side
list-view CSV/XLSX/table-PDF dump, not touched or extended by this domain.

**Folder numbering note:** this domain was not among the `01-08` slots `docs/controls/
BACKEND_KNOWLEDGE_POLICY.md` §4 originally enumerated (written 2026-09-17). Same precedent as
`16-crm/` — appended after the existing sequence (`17-layout-print/`) rather than renumbering
anything already committed.

## Files in this folder

| File | Covers | Status |
|---|---|---|
| [`layout-print-architecture.md`](layout-print-architecture.md) | Live-verified ERPNext print/PDF/email capability, ERPNext-owned vs. Ceylon-Stack-owned data boundary, canonical print document model, adapter/template-resolution architecture, PDF strategy decision, permission model, V1 document coverage matrix, package sequence (`LP-0`–`LP-9`); §12 covers `LP-2`'s actual shipped runtime architecture, authorization model, and known limitations | `LP-0`/`LP-1`/`LP-2` shipped; `LP-3` onward not started, not authorized by this document alone |

## Method

Live schema/data verification (`mcp__ceylon-stack__get_doctype_fields`/`list_documents` against the
real Hetzner instance) for `Print Format`, `Letter Head`, `Company`, `Address`, and `Email Account`
— no ERPNext print/PDF behavior in this document is assumed from generic Frappe documentation
without a corresponding live check, per `docs/controls/BACKEND_KNOWLEDGE_POLICY.md` §6. Full-source
code reads of `apps/frontend/src` (`lib/erpnext.ts`, `lib/export.ts`, `ExportMenu.tsx`) confirmed no
prior print/PDF frontend implementation exists.

## What's next

`LP-3` (Standard Ceylon Stack Template — the polished visual layout, plus authoring the Ceylon
Stack Jinja Print Format so the PDF path matches it) is the next package in sequence, per
`layout-print-architecture.md` §9. **Not authorized to start by this document alone** — see
`CLAUDE.md`'s dated `LP-2` authorization note and `layout-print-architecture.md` §12's Known
Limitations for what `LP-3`/`LP-4A` should pick up first (full authenticated end-to-end
verification against a real Sales Invoice, then the visual template itself).
