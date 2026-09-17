# Backend Knowledge Capture Policy

**Version:** 1.0
**Date:** 2026-09-17
**Audience:** Claude agents (`frontend-dev`, `frappe-dev`, `product-designer`, `code-reviewer`, `qa-tester`) and developers touching any ERP-facing feature
**Goal:** Ship fast on Frappe/ERPNext today, while continuously capturing the verified technical blueprint needed to build and migrate to a future Ceylon Stack native backend — without slowing frontend delivery.

This document is binding project-wide (not just for `apps/frontend`), alongside the other documents in `docs/controls/`. See `CLAUDE.md` at the repo root for the master entry point.

---

## 1. Why this exists

Ceylon Stack currently runs on Frappe/ERPNext as the operational backend, used deliberately as a mature reference implementation (accounting, GL, inventory, valuation, purchasing, sales, manufacturing, tax, workflows, permissions, document lifecycle). This is not the permanent architecture. The long-term goal is a Ceylon Stack native backend that replaces Frappe module by module without redesigning the frontend:

```
Now:          Frontend → Frappe/ERPNext → DB
Intermediate: Frontend → Ceylon Stack API → {Native Services, Frappe/ERPNext}
Future:       Frontend → Ceylon Stack API → Ceylon Stack Native Backend    (Frappe retired)
```

Every frontend feature implemented today must leave behind a documented backend specification, so that knowledge isn't lost once Frappe internals stop being visible day to day.

## 2. Priority order (do not invert)

1. Working, commercially usable frontend
2. Correct ERP behavior
3. Backend knowledge capture
4. Automated behavioral tests
5. Native-backend migration readiness
6. Refactoring / optimization

Documentation must never block shipping. If backend internals are unclear, ship the feature, document what's known, flag the rest as `NEEDS_VERIFICATION`, and continue — see §8.

## 3. Canonical model, not Frappe coupling

Never document only `Frontend field → Frappe field`. Always document the middle layer:

```
Frontend field → Ceylon Stack canonical field → Current Frappe mapping
```

Example: `customerId` → `sales_order.customer_id` (canonical) → `Sales Order.customer` (Frappe, current implementation detail).

The canonical model is Ceylon Stack's own business architecture. Frappe is one current implementation of it, not the definition of it. When documenting, distinguish:

- `REQUIRED_CEYLON_BEHAVIOR` — what our product actually needs
- `FRAPPE_CURRENT_BEHAVIOR` — how ERPNext currently does it
- `FRAPPE_ONLY_IMPLEMENTATION_DETAIL` — Frappe-specific plumbing that should NOT be reproduced natively

## 4. `docs/backend/` structure

```
docs/backend/
├── README.md
├── 00-architecture/     (canonical model, migration strategy)
├── 01-master-data/      (customer, supplier, item, warehouse, uom, currency, COA)
├── 02-sales/            (quotation, sales order, delivery, invoice, payment)
├── 03-purchasing/       (material request → RFQ → PO → GRN → PI → payment)
├── 04-inventory/        (stock entry, ledger, valuation, batch/serial)
├── 05-manufacturing/    (BOM, work order, job card, WIP, FG receipt)
├── 06-accounting/       (GL, AR, AP, trial balance, P&L, balance sheet)
├── 07-tax/
├── 08-workflows/        (approvals, document lifecycle, permissions)
├── 09-api-contracts/
├── 10-field-mappings/
├── 11-relationships/    (master-erd.md, Mermaid ERDs)
├── 12-business-rules/
├── 13-tests/
├── 14-frappe-reference/
├── 15-migration/        (migration-status.md)
└── 99-unverified/       (unverified-behaviours.md)
```

**Do not create empty documentation for its own sake.** Create or update a domain document only when the corresponding functionality is actually built or investigated — this folder grows with real feature work, not ahead of it.

## 5. What every meaningful ERP frontend feature must capture

Map to the relevant `docs/backend/<domain>/<doc>.md` — update the existing document, don't duplicate it. For each feature capture, where applicable:

- **Field mapping** (per field): frontend field/component/type → canonical entity.field/datatype → Frappe DocType.field/type; required/optional; default; read/write; editable after submit; validation; calculation; relationship; source/target.
- **Child tables as entities** — `items[]` is a 1:N child entity (e.g. `sales_order → sales_order_line`), not just a frontend array. Document its own fields and relationships.
- **Relationships** — cardinality (1:1, 1:N, N:1, N:N), both ends, required/optional, current Frappe link field. Update `docs/backend/11-relationships/master-erd.md` (Mermaid) when relationships are discovered.
- **Business rules** — give significant rules a permanent ID, e.g. `SO-VAL-001`, `SO-CALC-001`, `GRN-STK-001`, `ACC-GL-001`, `TAX-CALC-001`. These IDs should eventually trace Business Requirement → Documentation → Implementation → Test.
- **Calculations** — formula, inputs, order of evaluation, precision/rounding, currency/exchange rate handling, UOM conversion, valuation.
- **Document lifecycle** — what Create/Save/Edit/Submit/Approve/Reject/Cancel/Amend/Close/Delete/Duplicate/Reopen do: preconditions, validations, side effects, downstream documents.
- **Stock impact** — quantity movement, source/target warehouse, reserved/available/actual qty, batch/serial, valuation rate, stock value.
- **Accounting impact** — whether GL entries are created, debit/credit account *roles* (never hard-coded account numbers), amount source, cost center/project, posting date, cancellation/reversal behavior.
- **Document chains** — upstream/downstream documents and how IDs/quantities flow between them (e.g. Quotation → Sales Order → Delivery → Invoice → Payment).
- **API behavior** — document the canonical contract shape (e.g. `POST /api/v1/sales-orders/{id}/submit`) separately from the current Frappe REST payload (`/api/resource/Sales Order`); map canonical request/response ↔ current Frappe request/response.
- **Frappe source traceability**, where practical: ERPNext/Frappe version, DocType, child DocType, module, source file, relevant class/function, hook, event, API, DB effect. Mark verification status per rule: `Documentation: VERIFIED` / `Source Code: VERIFIED` / `Runtime Test: VERIFIED`.

## 6. Never invent unknown Frappe behavior

If a behavior is uncertain, do not guess. Mark it `STATUS: NEEDS_VERIFICATION` and add it to `docs/backend/99-unverified/unverified-behaviours.md` with how it should be verified (inspect ERPNext source / DocType / hook / API response; execute a test transaction; inspect GL Entry or Stock Ledger Entry). This must never block development — continue building, verify later.

## 7. Behavioral tests

Where practical, add test scenarios (input → expected subtotal/tax/total, expected stock ledger impact, expected GL impact, expected status) to `docs/backend/13-tests/`. These become the reference used later to compare ERPNext output against the native backend's output during migration.

## 8. Migration status

Every major backend domain carries a status in `docs/backend/15-migration/migration-status.md`:

`FRAPPE_REFERENCE → DOCUMENTED → CONTRACT_DEFINED → NATIVE_DEVELOPMENT → SHADOW_TESTING → NATIVE_PRODUCTION → FRAPPE_RETIRED`

All domains currently sit at `FRAPPE_REFERENCE`. Do not begin native migration work merely because documentation exists for a domain — migration happens only when commercially and technically justified, and generally in this order (lower to higher complexity): Master Data → CRM → Sales → Purchasing → Workflow → Inventory → Manufacturing → Tax → Accounting/GL. Accounting, inventory valuation, manufacturing costing, and financial statements stay on Frappe the longest.

## 9. What does NOT require backend documentation

Purely visual/UI-only changes (color, spacing, typography, animation, responsive layout, icons, cosmetic layout) do not need a `docs/backend/` update unless they also introduce a new field, calculation, API interaction, relationship, validation, workflow, or other backend behavior.

## 10. Definition of Done addition

For any meaningful ERP frontend feature, in addition to the existing per-document Definition of Done in `FRONTEND_GUIDE.md`, confirm:

- Frontend fields mapped → canonical → Frappe (including child tables)
- Relationships documented, ERD updated where required
- Validations, calculations, lifecycle, and upstream/downstream documents documented
- Stock, accounting, and tax impact documented (or explicitly marked out of scope for that feature)
- Frappe source reference recorded where verified
- Unverified behavior flagged in `99-unverified/`
- Test scenarios added where practical
- Migration status in `15-migration/migration-status.md` still accurate

At the end of a significant feature, report specifically what changed (field count, entities, relationships, rule IDs, which `docs/backend/` file was touched) — not just "documentation updated."

## 11. Relationship to other binding docs

This policy adds a documentation obligation on top of existing process; it does not change architecture, sequencing, session/subagent discipline, or the Current Mission priority lock in `CLAUDE.md`. Those still govern *what* gets built and *when*; this document governs what gets *recorded* once it's built. If this policy's documentation obligations would require expanding a package beyond its assigned scope (`AGENT_USAGE_POLICY.md` §8), documentation should still happen — it is part of finishing the package, not a new package.
