# Layout, Print & Document Output Engine — Architecture (`LP-0`/`LP-1`)

**Status:** `DOCUMENTED`. Discovery + Company Print Profile source mapping only — no frontend code
shipped. Recorded 2026-09-25 (packages `LP-0`, `LP-1`), authorized per `CLAUDE.md`'s dated
`LP-0`/`LP-1` note (Current Mission lock, item 6).

**Mission:** build a reusable Ceylon Stack Document Output Engine (Business Document → Document
Adapter → Canonical Print Document Model → Layout Template → Renderer → Preview/Print/PDF/Email) —
not one-off hard-coded print pages per transaction. Full brief context: the mission was issued
directly by Niroshan, dated 2026-09-25, matching the format and authorization pattern already
established by `CRM-1`/`CRM-2`/`CRM-3` and `FIN-1F`/`FIN-1G`.

**Concurrent work at the time of this package:** `CRM-3` (Activities & Follow-ups, implementation-
complete, reviewed, not yet `ACCEPTED`) and `FIN-1G-C` (Account Determination workspace) both sat
uncommitted in the working tree throughout this package. Neither was read, staged, edited, or
committed by this package — verified by `git status --short` before and after.

---

## 1. Existing Print/PDF Capability — none, verified

Full-text search of `apps/frontend/src` for print/PDF references found exactly one surface:
`ExportMenu.tsx` / `lib/export.ts`. It provides `exportToCsv`/`exportToExcel`/`exportToPdf` —
all three operate on **rows currently rendered in a list view** (mirrors ERPNext Desk's list-view
Export button), not a business document. `exportToPdf` uses `jspdf`+`jspdf-autotable` to dump a
plain table of the rows on screen — no company header, no letterhead, no line-item/tax/total
document structure, no per-doctype layout. `lib/erpnext.ts` (the sole sanctioned ERPNext API
surface per `docs/controls/FRONTEND_GUIDE.md` §5) has zero print/PDF/print-format functions.

**Conclusion:** this is a genuinely new capability. There is nothing existing to extend, and
nothing existing this package's design could conflict with or accidentally duplicate.

## 2. ERPNext/Frappe Capability — live-verified (Hetzner instance, 2026-09-25)

Verified via `mcp__ceylon-stack__get_doctype_fields`/`list_documents` against the real instance —
not assumed from generic Frappe documentation.

### 2.1 `Print Format` (real doctype, confirmed fields)

`doc_type` (Link → DocType), `standard` (Yes/No), `print_format_type` (Jinja/JS), `pdf_generator`
(**`wkhtmltopdf` or `chrome`** — both are real, selectable, native options), `html` (Jinja template
body, Code field), `margin_top/bottom/left/right`, `font`/`font_size`, `page_number` (Hide/Top
Left/Top Center/Top Right/Bottom Left/Bottom Center/Bottom Right), `css` (Custom CSS, Code field),
`print_format_builder`/`print_format_builder_beta` (visual-builder flags — out of scope, mission
§15 explicitly excludes a WYSIWYG designer for V1).

**7 standard Print Formats already shipped for Sales Invoice**, confirmed live: `Sales Invoice
Standard`, `Tax Invoice` (disabled), `Simplified Tax Invoice` (disabled), `Detailed Tax Invoice`
(disabled), `Sales Auditing Voucher`, `Sales Invoice Return`, `Sales Invoice with Item Image` — all
`print_format_type: Jinja`. This confirms native Jinja-template PDF rendering is real, working
infrastructure on this instance today, not a theoretical Frappe feature.

### 2.2 `Letter Head` (real doctype, confirmed fields + live records)

`image` (Attach Image), `content` (Header HTML Editor), `footer` (Footer HTML Editor),
`footer_image`, `header_script`/`footer_script` (JS), `is_default`, `disabled`. **Two real records
exist on this instance**: `Company Letterhead` and `Company Letterhead - Grey` (`is_default: 1`).

### 2.3 `Company` (relevant fields, confirmed live)

`company_logo` (Attach Image), `company_name`, `tax_id`, `phone_no`, `email`, `website`, `fax`,
`registration_details` (free-text Code field), `default_letter_head` (Link → Letter Head). The full
default-account graph (`default_bank_account`, `default_receivable_account`, etc.) also lives on
`Company` but is **Finance-owned** (`FIN-1`/`FIN-1G`'s territory) — this package reads it, never
duplicates or re-derives it.

### 2.4 `Address` (confirmed live)

Standard fields (`address_line1/2`, `city`, `state`, `country`, `pincode`, `email_id`, `phone`,
`is_primary_address`, `is_shipping_address`), linked generically to any party (Company, Customer,
Supplier) via a `Dynamic Link` child table (`links`). This is the existing mechanism this engine
must reuse to resolve a document's billing/shipping address — not a new address model.

**Known pre-existing gap this package inherits, does not create:** ADR-008/`master-erd.md` already
disclose (`MD-UNV-003`) that the Customer/Supplier ↔ Contact/Address `Dynamic Link` relationship is
not wired up anywhere in this frontend yet. Any adapter resolving a party's address in `LP-2`+
should confirm current state before assuming it "just works."

### 2.5 Bank/payment information

Not a direct `Company` field for print purposes — lives in `Bank Account` (already modeled by
Finance's `FIN-1`, see `06-accounting/chart-of-accounts-bank-account.md`), linked via `Company.
default_bank_account`. **Ownership: Finance-owned, read-only for this engine.**

### 2.6 Email — confirmed **not production-ready**

`Email Account` queried live: **zero records**. No outgoing mail is configured on this instance at
all. Per the mission's own instruction (§12: "never silently claim email support if the backend
capability is not verified"), `LP-8` cannot ship a working email feature today. The V1 architecture
should define the integration boundary (a `sendDocumentEmail()` seam wrapping Frappe's standard
`frappe.core.doctype.communication.email.make`) without claiming or faking delivery.

### 2.7 Not yet live-verified — `NEEDS_VERIFICATION`

- `LP-UNV-001`: Exact PDF/print-view HTTP endpoint behavior on this specific Frappe v16 build
  (route, auth header shape, query params, response content-type) — no generic authenticated HTTP
  call was made in this session; only doctype/document metadata was queried.
- `LP-UNV-002`: Whether `pdf_generator: chrome` is actually usable on this Hetzner container (needs
  a headless-Chrome binary present in the `backend` image) or silently falls back to
  `wkhtmltopdf` — infra-level, unverified. `LP-2` should confirm before depending on either.
- `LP-UNV-003`: LKR amount-in-words / currency formatting conventions via ERPNext's
  `money_in_words` utility — not checked against this instance's actual output yet.

## 3. Ownership Boundary — ERPNext-owned vs. Ceylon-Stack-owned

| Data / capability | Owner | Notes |
|---|---|---|
| Company identity (name, logo, tax ID, registration, contact) | ERPNext (`Company`) | Read-only for this engine |
| Letterhead image/header/footer HTML | ERPNext (`Letter Head`) | Read-only; `Company.default_letter_head` resolves which one |
| Billing/shipping addresses | ERPNext (`Address` + `Dynamic Link`) | Read-only; inherits `MD-UNV-003` gap |
| Bank/payment details | ERPNext (`Bank Account`), Finance-owned | Read-only; this engine never introduces a second bank-details source |
| Document data (lines, totals, tax, status) | ERPNext (the transaction doctype itself) | Read-only, **never recomputed client-side** — matches this app's existing "no client-side BOM explosion" precedent (`05-manufacturing/bom.md`) |
| PDF rendering engine | ERPNext (Frappe's native `wkhtmltopdf`/`chrome` `pdf_generator`) | Reused, not replaced — decision below |
| Canonical print document model | **Ceylon Stack** | New; translates the above into a stable, Frappe-independent shape |
| Document adapters (per-doctype) | **Ceylon Stack** | New |
| React preview template | **Ceylon Stack** | New |
| Jinja Print Format (for PDF) | **Ceylon Stack-authored, ERPNext-hosted** | A `Print Format` record this app creates/maintains, kept in sync with the React template by hand in V1 (no shared source between the two — see §5's disclosed cost) |
| Template resolution / config | **Ceylon Stack** | New, minimal for V1 (see §6) |
| Email delivery | **Not implemented** | Boundary only — see §2.6 |

No Ceylon Stack-specific config DocType is required for V1: `Company.default_letter_head` +
existing `Print Format` records are sufficient. A "Company Print Profile" is therefore **not** a
new persisted entity in V1 — it is the read/resolve step over data ERPNext already owns.

## 4. Canonical Print Document Model (V1 contract)

Trimmed from the mission brief's conceptual sketch against what is actually verified in §2 —
nothing invented for a section with no verified backing data (e.g. no `signatures` sub-object; a
future template can add one when a document family genuinely needs it).

```text
DocumentPrintModel
├── company        { legalName, logo, address, phone, email, website, taxId, registrationDetails }
├── document       { type, number, date, postingDate, dueDate, status, reference, currency }
├── businessPartner { code, name, billingAddress, shippingAddress, taxId }
├── lines[]        { itemCode, description, quantity, uom, rate, discount, tax, amount }
├── taxes[]        (from the doctype's own tax child table — e.g. Sales Taxes and Charges)
├── totals         { subtotal, discount, taxes, rounding, grandTotal }  — read verbatim, never recomputed
├── bankInformation (optional; from Company.default_bank_account, Finance-owned)
├── terms          (optional; Terms and Conditions)
├── notes
└── metadata       { generatedAt, templateUsed }
```

The exact per-field `Frontend Field → Canonical Entity.Field → Frappe DocType.Field` mapping (per
`BACKEND_KNOWLEDGE_POLICY.md` ADR-002) will be finalized in `LP-2` against the real Sales Invoice
pilot, not speculatively completed here ahead of the code that consumes it.

## 5. PDF Architecture Decision

**Decision (confirmed by Niroshan, 2026-09-25):** reuse Frappe's native PDF generation rather than
introduce a second rendering engine. Mission §11 requires explicit justification for a second PDF
engine — none exists, and §2.1 confirms native Jinja/PDF rendering is real, proven infrastructure
on this instance already (7 shipped Sales Invoice formats).

**Consequence, disclosed rather than glossed over:** browser/print preview (Ceylon Stack's own
React template, full UX control, no Desk chrome — mission §10) and the actual PDF (Frappe's Jinja
`Print Format`) are **two separately maintained representations of the same standard layout** in
V1 — there is no shared template source between them. `LP-3` (Standard Template) must therefore
build and keep both in sync by hand; a visual drift between preview and PDF is a known, accepted V1
limitation, not a defect, until a future package explores a shared-source approach. See
`docs/architecture/decisions/README.md` ADR-009 for the durable record of this decision.

## 6. Template Resolution (V1 scope)

V1 ships exactly one template ("Ceylon Stack Standard") and one `resolveTemplate(doctype, company)`
function that always returns it — not the full System→Company→DocType→Explicit chain the mission
sketches conceptually. The function signature is kept future-shaped (`doctype`/`company` as
parameters now, even though V1 ignores `company`) specifically so `LP-9` can extend the resolution
logic later without a rewrite of every call site, per mission §4's "avoid overengineering, don't
foreclose extension" instruction.

## 7. Permission & Security Model (for `LP-2`+ to implement, not yet built)

No print/PDF-specific server code exists yet. Binding requirement carried forward from mission §16
and this app's existing pattern (e.g. `CRM-3`'s server actions re-verifying session state
server-side, per `PROGRESS.md`): every future print/PDF/email server action must re-run ERPNext's
own permission check (via `getDoc`/equivalent) on the server before returning any document data —
a client-supplied doctype+name pair is never sufficient on its own.

## 8. V1 Document Coverage Matrix

| Family | Status | Note |
|---|---|---|
| Sales Invoice | Not started | Pilot, `LP-4A` |
| Quotation, Sales Order, Delivery Note | Not started | `LP-4B`/`LP-4C`/`LP-4D` |
| Purchase Order, Purchase Receipt | Not started | `LP-5A`/`LP-5B` |
| Payment Receipt / Journal-related output | Not started, **blocked** | `FIN-2` (Payment Entry) and `FIN-3` (Journal Entry) are **not authorized** in the frontend at all yet — `LP-6A`/`LP-6B` cannot start until Finance authorizes those doctypes to exist in this app in the first place |

## 9. Recommended Package Sequence

Matches the mission's own `LP-0`…`LP-9` plan. No reordering — the mission's §11 PDF fork is
resolved in §5 above, so no separate `LP-2a` spike is needed; `LP-2` proceeds directly against the
decided architecture.

```text
LP-0  Discovery + architecture                        — DONE (this package)
LP-1  Company Print Profile / source mapping           — DONE (this package)
LP-2  Canonical Document Output Engine (adapters, lib/erpnext.ts additions, DocumentOutputActions)
LP-3  Standard Ceylon Stack Template (React preview + synchronized Jinja Print Format)
LP-4A Sales Invoice pilot (preview + print + PDF, real transaction data)
LP-4B Quotation
LP-4C Sales Order
LP-4D Delivery Note
LP-5A Purchase Order
LP-5B Purchase Receipt / GRN
LP-6A Payment Receipt / Payment Entry output   — blocked on FIN-2 authorization
LP-6B Journal-related output                    — blocked on FIN-3 authorization
LP-7  Unified Preview/Print/PDF actions across all shipped families
LP-8  Email integration                          — blocked on an Email Account existing on the instance
LP-9  Template configuration / assignment
```

## 10. Files Expected to Change in `LP-2`

New: `lib/print/` (per-doctype adapters, canonical model types, `resolveTemplate`), additions to
`lib/erpnext.ts` (print-format/PDF calls, following the existing `erpnextFetch` pattern), a new
`DocumentOutputActions` component (mission §9's sketch — a new action-row pattern, distinct from
the existing state-mutating `DocActionBar`), one or more new `Print Format` records authored in
ERPNext for the Ceylon Stack standard layout. None of this touches `CRM-3` or `FIN-1G-C`'s files.
`Sidebar.tsx` should not be edited by the first `LP` package needing a nav entry until `CRM-3` is
committed — both packages currently have uncommitted changes to it in flight (see this document's
opening "Concurrent work" note).

## 11. Governance

This document and `LP-1`'s scope are authorized by `CLAUDE.md`'s dated `LP-0`/`LP-1` Current
Mission lock note (2026-09-25) — the same exception-stream pattern as `CRM-1`/`CRM-2`/`CRM-3` and
`FIN-1F`/`FIN-1G`, written **before** implementation started this time (the prior two CRM packages
each disclosed writing theirs late; this note breaks that pattern rather than repeating it).
**`LP-2` is a separate package and is not authorized to start in the same session as `LP-0`/`LP-1`**
per `docs/controls/AGENT_USAGE_POLICY.md` §4.1's one-package-per-session rule. `FIN-2`/`FIN-3`
remain not authorized, and nothing in this document reorders Finance V1 or any CRM package.
