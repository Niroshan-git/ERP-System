# Layout, Print & Document Output Engine — Domain Overview

**Status:** `DOCUMENTED` (discovery/architecture only, packages `LP-0`/`LP-1`, 2026-09-25). **No
frontend exists.** No route, Sidebar entry, adapter, template, or server action has been built for
this domain. `apps/frontend`'s only existing "export" surface (`ExportMenu.tsx`/`lib/export.ts`) is
a client-side list-view CSV/XLSX/table-PDF dump — unrelated to business-document printing and not
extended or touched by this package.

**Folder numbering note:** this domain was not among the `01-08` slots `docs/controls/
BACKEND_KNOWLEDGE_POLICY.md` §4 originally enumerated (written 2026-09-17). Same precedent as
`16-crm/` — appended after the existing sequence (`17-layout-print/`) rather than renumbering
anything already committed.

## Files in this folder

| File | Covers | Status |
|---|---|---|
| [`layout-print-architecture.md`](layout-print-architecture.md) | Live-verified ERPNext print/PDF/email capability, ERPNext-owned vs. Ceylon-Stack-owned data boundary, canonical print document model, adapter/template-resolution architecture, PDF strategy decision, permission model, V1 document coverage matrix, package sequence (`LP-0`–`LP-9`) | `LP-0`/`LP-1` documented; `LP-2` onward not started, not authorized by this document alone |

## Method

Live schema/data verification (`mcp__ceylon-stack__get_doctype_fields`/`list_documents` against the
real Hetzner instance) for `Print Format`, `Letter Head`, `Company`, `Address`, and `Email Account`
— no ERPNext print/PDF behavior in this document is assumed from generic Frappe documentation
without a corresponding live check, per `docs/controls/BACKEND_KNOWLEDGE_POLICY.md` §6. Full-source
code reads of `apps/frontend/src` (`lib/erpnext.ts`, `lib/export.ts`, `ExportMenu.tsx`) confirmed no
prior print/PDF frontend implementation exists.

## What's next

`LP-2` (Canonical Document Output Engine — the actual adapter/canonical-model/lib code) is the next
package in sequence, per `layout-print-architecture.md` §9. **Not authorized to start by this
document alone** — see `CLAUDE.md`'s dated `LP-0`/`LP-1` authorization note, which explicitly scopes
this session's authorization to discovery + documentation only, and `layout-print-architecture.md`'s
Governance section.
