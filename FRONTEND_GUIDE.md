# Ceylon Stack Frontend Guide

**Version:** 1.1
**Date:** September 2026
**Audience:** Claude agents (`frontend-dev`, `product-designer`, `code-reviewer`, `qa-tester`) and developers working on `apps/frontend`
**Goal:** Build a complete custom frontend so end users never see the original ERPNext Desk.

This document is the single source of truth for how the frontend must be built.

> **Provenance note:** the rules in this guide were originally drafted externally (via Grok) as a sanity-check of the frontend architecture, then reconciled against the actual `apps/frontend` codebase on 2026-09-15. Section 3 and Section 5 below have been corrected to match real file/function names — do not re-introduce the original placeholder names (`getList`, `(auth)/`, etc.) as if they were missing; they exist under the names shown here.

---

## 1. Product Goal

Ceylon Stack frontend must become the **only ERP interface** that clients use.

- ERPNext runs as a pure backend (headless).
- Users must never be sent to the original ERPNext Desk.
- Only main operational features are built in the first versions.
- All business logic, validation, stock, accounting, and permissions stay inside ERPNext.

---

## 2. Architecture Rules (Do Not Break)

1. **ERPNext is the single source of truth**
   - All documents, calculations, stock ledger, accounting entries, and permissions live in ERPNext.
   - Frontend only creates, reads, updates, submits, and cancels documents via API.

2. **Never modify ERPNext core**
   - Only use the custom `smart_factory` app + REST API.

3. **Headless only**
   - `smart_factory`, `mes-service`, `mcp-server`, and `frontend` talk to ERPNext **only** through the REST API.
   - This keeps the proprietary layer legally separate under GPL-3.0.

4. **One consistent document pattern**
   ```
   /module/doctype          → List
   /module/doctype/new      → Create
   /module/doctype/[name]   → View / Edit
   ```

5. **Shared logic lives in `lib/` and `components/`**
   - Never copy-paste API or form logic into individual pages.

---

## 3. Repository & Folder Structure

### Monorepo layout (already established)

```
ERP-System/
├── apps/
│   ├── frontend/          ← Next.js (this guide)
│   ├── smart_factory/     ← Custom Frappe app
│   ├── mes-service/       ← FastAPI MES / OEE
│   ├── mcp-server/        ← AI tools layer
│   └── ceylon_services/
├── docs/
├── infra/
├── PLAN.md
├── PROGRESS.md
├── DESIGN.md
└── CLAUDE.md
```

### Actual frontend structure (verified 2026-09-15)

```
apps/frontend/src/
├── app/
│   ├── login/                     # Login (session route, not a route group)
│   ├── api/auth/                  # Auth API route
│   ├── (app)/
│   │   ├── layout.tsx             # Sidebar + Topbar shell
│   │   ├── page.tsx               # Main dashboard
│   │   ├── sales/                 # 17 doctype folders — see §9
│   │   │   ├── quotations/
│   │   │   │   ├── page.tsx       # List
│   │   │   │   ├── [name]/page.tsx
│   │   │   │   └── actions.ts     # Server actions
│   │   │   ├── orders/
│   │   │   ├── delivery-notes/
│   │   │   ├── invoices/
│   │   │   ├── customers/, items/, pick-lists/, price-lists/, ...
│   │   ├── reports/                # Reports hub (17/18 live)
│   │   ├── manufacturing/          # not started — next priority, see §4
│   │   ├── buying/                 # not started
│   │   └── stock/                  # not started
├── components/                    # 54 reusable UI components — see §7
├── lib/
│   ├── erpnext.ts                 # ALL ERPNext API calls — see §5
│   ├── actions/                   # cross-cutting server actions (lookups, comments)
│   ├── session.ts, docStatus.ts, erpStatus.ts, lineRows.ts, tableColumns.ts, ...
└── middleware.ts
```

**Rules**
- One folder per DocType.
- `actions.ts` contains server actions for that document only.
- Forms and tables live in `components/`.
- No raw `fetch` calls inside page components.

---

## 4. Module Priority Order

Build strictly in this order. Do not jump ahead.

| Priority | Module              | Scope (Main features only)                                      | Status (2026-09-15)            |
|----------|---------------------|--------------------------------------------------------------------|--------------------------------|
| 1        | **Sales**           | Quotation → Sales Order → Delivery Note → Sales Invoice + Customers + Items + basic pricing | Core flow shipped and live-verified; Pick & Pack, partial fulfillment, discounts, quotation-lost also shipped |
| 2        | **Manufacturing**   | Work Order, Job Card, simple BOM, downtime logging, live status / basic OEE | **Next** — OEE calc logic planned (M0 done), M1–M4 not started, frontend screens not started |
| 3        | **Buying**          | Material Request → Purchase Order → Purchase Receipt → Purchase Invoice + Suppliers | Not started |
| 4        | **Stock**           | Stock balance, basic movement, warehouse view (simplified)      | Not started |
| 5        | **Accounting (Light)** | Payment Entry, outstanding invoices, simple receivables/payables | Not started |
| 6        | **Dashboard**       | Operational KPIs, sales & production summary                    | Ahead of schedule — Sales Flow scene map, Reports hub, and Selling workspace home already shipped in parallel (guide explicitly allows this) |

### Explicitly out of scope for v1
- Full Journal Entry / Period Closing screens
- Complex stock valuation screens
- Deep HR / Payroll
- Full Quality Management
- Every ERPNext report
- Trying to make the frontend 100% feature-equal with Desk

---

## 5. API Layer Rules (`lib/erpnext.ts`)

This file is the **only** place that talks to ERPNext.

### Actual exported functions (verified 2026-09-15 — exceeds the original minimum list)

```ts
listDocs(doctype, { filters, fields, limit, orderBy, ... })   // was drafted as getList()
getDoc(doctype, name)
createDoc(doctype, data)
updateDoc(doctype, name, data)
deleteDoc(doctype, name)
submitDoc(doctype, name)
cancelDoc(doctype, name)
callMethod(method, args)
callDocMethod(...)
callMethodWithResult(method, args)
runReport(...)
getDocInfo(...)                                                // comments/activity feed
addComment(...)
verifyErpNextLogin(...)
```

Link-option fetching lives in `lib/linkOptions.ts` → `fetchLinkOptions(doctype)` (was drafted as `getLinkOptions()` inside `erpnext.ts` — it was split out deliberately, keep it that way).

### Guidelines
- Always return consistent response shapes.
- Handle errors cleanly (network, permission, validation).
- Support field selection and pagination.
- Cache link options (Customer, Item, Warehouse, Price List, etc.) where sensible.
- Never put raw `fetch` or API credentials inside page components.
- Prefer server actions + this helper over client-side direct calls when possible.

---

## 6. Standard Document Pattern

Every document must follow the same UX and code pattern.

### List Page
- Use shared `DataTable` + `ListFilterBar` + `ColumnPicker`
- Show only important columns
- Primary actions: New, Open, Submit (when allowed)
- Support basic filters and search

### Form Page (New + Edit)
- Shared form shell
- Important fields on top
- Line items handled by reusable `LineItemsEditor` / `LineItemsTable`
- Top action bar: Save → Submit → Cancel (match ERPNext document states) via `DocActionBar`
- Status displayed with `StatusPill`
- Do **not** expose every ERPNext field — only what daily users need

### Document States
Respect ERPNext states:
- Draft
- Submitted
- Cancelled

Frontend must not allow illegal transitions.

---

## 7. Component Guidelines

### Reusable components (54 in `components/` as of 2026-09-15 — keep extending, don't fork)
- Lists: `DataTable`, `ListFilterBar`, `ColumnPicker`, `MasterTable`
- Documents: `DocActionBar`, `DocTabs`, `DocField`, `SavedBanner`
- Line items: `LineItemsEditor`, `LineItemsTable`, `LineSelectionEditor`, `BatchSerialPicker`
- Status/feedback: `StatusPill`, `ProgressBar`, `AccessDeniedNotice`
- Shell: `Sidebar`, `FullscreenToggle`, `Breadcrumb`
- Form shells: `QuotationForm`, `SalesOrderForm`, `SalesInvoiceForm`, `DeliveryNoteForm`, `CustomerForm`, `ItemForm`, `MasterForm`
- Activity: `ActivityTimeline`, `RelationshipMap`
- Dashboard: `SalesFlowMap`, `SalesFlowNodeDialog`, `LineChart`
- Reports: `ReportFilterBar`, `ReportTable`, `ReportsList`

### Rules
- Prefer composition over duplication.
- Keep components pure and focused.
- Business rules stay in ERPNext or in `lib/` helpers, not inside presentational components.
- Before adding a new component, check this list first — most list/form/status needs are already covered.

---

## 8. Performance Guidelines (10–15 Concurrent Users)

The current architecture (Next.js → ERPNext REST API on Hetzner CX23) is sufficient for 10–15 concurrent users **if** these rules are followed:

1. Prefer list endpoints with selected fields over loading full documents.
2. Cache master data (Items, Customers, Warehouses, Price Lists).
3. Debounce search inputs.
4. Do not load heavy child tables until the user opens the document.
5. Use loading skeletons and optimistic UI.
6. Avoid chatty waterfall API calls on page load.
7. Monitor server resources; plan upgrade to CX33 only when actually needed.

---

## 9. Sales Module – Current State & Rules

### Already present (frontend branch, verified 2026-09-15)
- Core cycle folders: `quotations`, `orders`, `delivery-notes`, `invoices`, `pick-lists`
- Masters: `customers`, `contacts`, `addresses`, `items`, `item-groups`, `customer-groups`, `price-lists`, `territories`, `sales-persons`, `sales-partners`, `campaigns`, `settings`
- Supporting components and `lib` helpers exist and are shared, not duplicated per-doctype
- Shipped beyond the original happy path: Pick & Pack (picked_qty/delivered_qty write-back, live-verified), partial fulfillment across multiple partial SO/Invoice, discount fields, quotation "Set as Lost", Sales Flow scene-based process map, Reports hub (17/18 reports live)

### Rules for completing Sales
1. Happy path is rock-solid: `Quotation → Sales Order → Delivery Note → Sales Invoice` — create → save → submit → cancel verified live on each.
2. Secondary masters (Campaigns, Sales Partners, etc.) can stay lighter.
3. Do not add more Sales screens beyond what's already shipped without a specific gap — see `docs/ceylon-stack-sales-scenarios.md` for the tracked scenario list (2 of 5 phases done as of 2026-09-14/15).
4. Treat Sales as the reference implementation for every rule in this guide when building Manufacturing next.

---

## 10. Manufacturing Module – Next Focus

When starting Manufacturing, reuse the exact same patterns as Sales:

- `work-orders/` (list + new + [name])
- `job-cards/`
- Simple BOM view
- Downtime logging
- Live status / basic OEE display

Manufacturing is the real product differentiator for Ceylon Stack. Keep forms focused on what floor supervisors and planners actually need. The OEE calculation logic and Ideal Cycle Time formula are already planned/corrected at the backend level (see project memory / `PLAN.md`) — the frontend layer here is purely the UI on top of that, following §5–§7 of this guide.

---

## 11. Branding & UX

- Follow `DESIGN.md` and `docs/brand.md` strictly.
- Use only Ceylon Stack design tokens (Sapphire, Cinnamon, Tea, Turmeric, Terracotta, etc.).
- Status colors must use the semantic tokens (Tea = running/good, Turmeric = attention, Terracotta = down/error).
- Typography: Fraunces (display), Archivo (UI headings), IBM Plex Sans / Mono (body & data).
- Mobile-first. The interface must work well on phones for supervisors.

---

## 12. What Agents Must Not Do

- Modify ERPNext core files.
- Put business logic in the frontend that already exists in ERPNext.
- Rebuild every ERPNext report or setup screen.
- Create inconsistent folder or naming patterns (don't invent `getList()` when `listDocs()` already exists — extend, don't fork).
- Add new modules before the previous priority module's core flow is stable (Manufacturing is next, not Buying/Stock).
- Hard-code colors or fonts outside the design tokens.
- Expose the original ERPNext Desk to normal users.

---

## 13. Immediate Action Checklist for Agents

When working on the frontend, follow this order:

1. **Read this guide + `DESIGN.md` + `PROGRESS.md`** before writing code.
2. **Sales core flow is stable** — treat it as the reference pattern, don't re-litigate it.
3. **Lock shared patterns**
   - `lib/erpnext.ts` and `lib/linkOptions.ts` are final — extend, don't duplicate.
   - Ensure all new documents follow the same list/form pattern as Sales.
4. **Align branches**
   - Keep `frontend` branch work clearly integrated or documented against `main`.
5. **Start Manufacturing next** (§10), applying the exact same folder and component patterns as Sales.
6. **Update `PROGRESS.md`** after meaningful work, and invoke the `release-tracker` subagent once a phase is shipped and verified (per `CLAUDE.md` ground rules).

---

## 14. Definition of Done (per document)

A document (e.g. Sales Order) is considered done when:

- [ ] List page works with filters and pagination
- [ ] Create page works and saves as Draft
- [ ] Edit page loads and updates correctly
- [ ] Submit and Cancel work and respect ERPNext states
- [ ] Line items work correctly
- [ ] Uses shared components and `lib/erpnext.ts`
- [ ] Follows Ceylon Stack visual design
- [ ] Works on mobile widths
- [ ] Error states are handled cleanly

---

## 15. Reference Files

| File | Purpose |
|------|---------|
| `DESIGN.md` | Brand identity & design tokens |
| `PLAN.md` | Overall project plan |
| `PROGRESS.md` | What has actually been done |
| `CLAUDE.md` | Project context & ground rules |
| `docs/architecture.md` | Headless architecture notes |
| `docs/ceylon-stack-sales-scenarios.md` | Sales scenario gap tracking |
| This file (`FRONTEND_GUIDE.md`) | Frontend implementation rules |

---

**End of Guide**

Agents: Follow this document strictly. When in doubt, prefer fewer screens with solid core flows over many incomplete screens.
