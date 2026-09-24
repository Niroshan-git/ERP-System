# Architecture Decision Records

Durable, cross-cutting architecture decisions for Ceylon Stack — not day-to-day implementation
choices (those belong in `PROGRESS.md`). No ADR convention existed in this repo before this file;
established here per `docs/controls/BACKEND_KNOWLEDGE_POLICY.md`'s backend knowledge system
activation (2026-09-17). New ADRs are appended below as new sections (`ADR-00N`); split into
one-file-per-ADR only if this log grows unwieldy.

## ADR-001 — Use ERPNext/Frappe as the initial reference backend

**Status:** Accepted, active.
Ship Ceylon Stack on ERPNext/Frappe now rather than building a native backend first. Faster time
to market, lower initial engineering cost, proven ERP behavior, and real customer validation
before committing engineering resources to a from-scratch backend. See `CLAUDE.md`'s "Core
Architecture Decision" and `docs/architecture.md`.

## ADR-002 — Keep the Ceylon Stack canonical model independent from Frappe

**Status:** Accepted, active.
Every backend-facing frontend field is documented as `Frontend Field → Canonical Entity.Field →
Current Frappe DocType.Field` (`docs/controls/BACKEND_KNOWLEDGE_POLICY.md` §3), never
`Frontend → Frappe` directly. Frappe's naming is frequently reused as the canonical name too where
it's already good ERP vocabulary — reuse is fine; the point is the canonical layer is declared
explicitly and independently of Frappe, so it can survive Frappe's eventual retirement without a
rewrite of the contract the frontend depends on.

## ADR-003 — Capture backend behavior during frontend development, not after

**Status:** Accepted, active.
Backend knowledge capture (`docs/backend/`) is part of a package's Definition of Done
(`CLAUDE.md`'s Package Closure Rules §5, `BACKEND_KNOWLEDGE_POLICY.md` §10), executed alongside
the frontend package that discovers the behavior — not deferred to a later "write the docs" phase
that would rely on institutional memory instead of live verification.

## ADR-004 — Migrate the native backend domain-by-domain, not all at once

**Status:** Accepted, active.
Migration order (lower to higher complexity): Master Data → CRM → Sales → Purchasing → Workflow →
Inventory → Manufacturing → Tax → Accounting/GL (`BACKEND_KNOWLEDGE_POLICY.md` §8). Order may
change based on technical dependencies or commercial requirements, but no domain skips
`FRAPPE_REFERENCE → DOCUMENTED → CONTRACT_DEFINED → NATIVE_DEVELOPMENT → SHADOW_TESTING →
NATIVE_PRODUCTION → FRAPPE_RETIRED`.

## ADR-005 — Use behavioral compatibility tests before migrating any domain

**Status:** Accepted, not yet started.
Test scenarios captured per domain (`docs/backend/<domain>/*.md`'s Test Scenarios sections,
sourced from real live QA runs) become the reference used to compare ERPNext's output against the
native backend's output during migration — they are not written after the fact from
specification, they're the actual runtime behavior already observed.

## ADR-006 — Do not migrate accounting or stock valuation logic until sufficiently verified

**Status:** Accepted, active.
Accounting (GL/AR/AP), inventory valuation, manufacturing costing, and financial statements stay
on Frappe the longest in the migration order (ADR-004) precisely because their correctness is
highest-stakes and least forgiving of a native-backend bug. Several GL/accounting impacts are
still `NEEDS_VERIFICATION` even for domains otherwise documented (e.g. `MFG-UNV-005`) — that gap
must close before any accounting-adjacent domain moves past `DOCUMENTED`.

## ADR-007 — Master Data is a first-class shared domain, not owned by any transactional module

**Status:** Accepted, active, **largely implemented**. Originally recorded 2026-09-17 as
architecture/documentation only, with frontend implementation "not yet started." That framing is
now stale and was corrected 2026-09-22: a separate session shipped most of the proposed route/IA
change on 2026-09-18/19 — before this ADR was ever committed — under ad hoc package names, not the
architecture doc's own MD-1–MD-10 numbering. See `docs/master-data-architecture.md` (corrected in
the same pass) for the reconciled current state, remaining gaps, and package sequence.

Shared business entities (Item, Customer, Supplier, Warehouse, UOM, Price List, Item Group,
Customer Group, Supplier Group, Territory, Contact, Address, Company, Cost Center, Project, BOM)
have exactly one canonical identity and one canonical route, regardless of which transactional
module a user reaches them from. Sales, Buying, Stock, Manufacturing, and future modules (Finance,
CRM, Projects) consume canonical Master Data; they do not own duplicate copies of it. Contextual
navigation from any transaction resolves to that same canonical record rather than a
module-specific duplicate screen.

**Current implementation state (verified 2026-09-22, not asserted):** `Sidebar.tsx` has a
`master-data` module with real routes under `apps/frontend/src/app/(app)/master-data/`. Item, Item
Group, Price List, Customer, Customer Group, Supplier, Contact, Address, Territory, and Warehouse
have all moved from `/sales/*`/`/buying/*`/`/stock/*` to canonical `/master-data/*` routes, each
independently reviewed and ACCEPTED. BOM has a shipped list/detail/create/Draft-edit screen at
`/master-data/boms`. **Corrected 2026-09-22:** Package 4A was never independently reviewed before
`MD-R1`; Package 4B *was* independently reviewed by Codex and returned `CHANGES REQUIRED`, partially
remediated by `6c38f7b`. `MD-R1` (2026-09-22) then independently reviewed the complete shipped BOM
surface, also `CHANGES REQUIRED`; `23886ac` remediated those findings; a separate-account/session
governance confirmation subsequently accepted that remediation. **BOM is now independently
ACCEPTED** — see `docs/master-data-architecture.md` §9 for the full chronology. Batch and Serial No
were deliberately kept under `/stock/*` (hybrid masters, confirmed twice). Supplier Group,
Operations, Workstations, and the Financial/Organizational masters (Company, Cost Center, Project,
UOM) have no dedicated screens yet. `docs/backend/01-master-data/` — required by
`BACKEND_KNOWLEDGE_POLICY.md` for the domains already shipped — **now exists** (package MD-R2,
`5d291db`, 2026-09-22, independently reviewed and ACCEPTED), closing what was previously open
documentation debt. It surfaced one confirmed frontend gap, not resolved by that package: the
Customer/Supplier ↔ Contact/Address `Dynamic Link` relationship ERPNext supports natively is not
wired up anywhere in this frontend (`MD-UNV-003`) — a product/scope decision for a future package,
not a documentation defect.

`lib/erpnext.ts` remains doctype-parameterized; no master entity has been duplicated by any of the
domain packages that shipped this ADR's ownership model.

## ADR-008 — `docs/ceylon-stack-documentation.html` is a generated artifact, not a source file

**Status:** Accepted, active. Recorded 2026-09-25 (package `DOCS-HELP-1`).

**Decision:** `docs/ceylon-stack-documentation.html` moved from a single hand-edited HTML file to
a markdown-driven pipeline (`node docs/tools/generate-docs.js`), with three source inputs:

1. `docs/tools/templates/` — the pre-existing Release Log content (Live Today/Upcoming/Reference/
   Changelog), migrated verbatim, unchanged in substance or editing pattern — still owned and
   hand-edited by the `release-tracker` subagent the same way it always was, just at a different
   file path. This preserves the one part of the old system that was already working well,
   per the mission's explicit instruction not to build a second, disconnected documentation
   system.
2. `docs/product/` — new markdown source of truth for the Product Guide (how to use a business
   document) and Implementation Guide (what must be configured first) layers, using a standard
   schema (YAML frontmatter + `## Section` headers, parsed by `SECTION_MODES` in the generator).
   Organized by module folder (`getting-started/`, `sales/`, `manufacturing/`, `crm/`, `finance/`,
   etc.), matching the target navigation IA.
3. `docs/backend/` — unchanged. Remains the sole Technical Architecture source (per
   `BACKEND_KNOWLEDGE_POLICY.md`); the generator only indexes it (domain folder → files), it does
   not parse or duplicate its content into the generated HTML.

**Why this shape, not a bigger rewrite:** the alternative considered was fully migrating the
Release Log's ~250 lines of dense, chronological engineering narrative into the new structured
per-document schema. Rejected — that content is a changelog, not stable per-feature
documentation; forcing it into `## Prerequisites`/`## Lifecycle`-shaped sections would have been
busywork with real fabrication risk (dates, commit hashes, and caveats are exact and load-bearing)
for no reader benefit. The two content types (living process documentation vs. dated release
history) are allowed to stay structurally different; they're unified only by shared visual design
and a shared page.

**Why generated, not another hand-edited file:** `docs/product/` content needs mode-tab filtering
(Product/Implementation/Technical), client-side search, and graceful empty-section hiding — all
practical to do from structured markdown + a small deterministic generator, impractical to keep
hand-consistent across dozens of future documents edited by different sessions over time. The
generator is a zero-dependency Node script (`docs/tools/generate-docs.js` /
`docs/tools/validate-docs.js`) — no build toolchain, no npm install, consistent with "lowest
long-term maintenance cost" for a one-person project.

**What this does not change:** `docs/backend/`'s structure, ownership, or `BACKEND_KNOWLEDGE_POLICY.md`
itself; the Release Log's editing house-style; the Current Mission priority lock or any package's
scope. `CLAUDE.md`'s Package Closure Rules gained one new item (`docs/product/` updated for
user-facing features, or `Documentation Impact: NONE` recorded) and the existing HTML-update item
now points at the generator instead of direct edits.

**Known gap, not fabricated as complete:** `docs/product/` coverage is intentionally partial as of
this ADR — Getting Started, Master Data (overview only), CRM (overview + Lead), Sales (overview +
Quotation), Purchasing (overview only), Inventory (overview only), Manufacturing (overview + Work
Order), and Finance (overview only). Most business documents (Sales Order, Delivery Note, Sales
Invoice, BOM, Material Transfer, Complete Production, Job Card, Production Plan, Opportunity, Bank
Account, Chart of Accounts, every Purchasing/Inventory document) do not yet have their own
`docs/product/` page — they remain covered only by the Release Log and `docs/backend/`. Recommended
`DOCS-HELP-2` scope: extend `docs/product/` coverage one shipped document at a time, ideally as
part of each future package's own Documentation Impact step rather than a single large backfill
pass.

**Does not yet decide:** whether Customer and Supplier are unified into a single canonical
"Business Partner" concept. The shipped "Business Partner domain" package only grouped Customer and
Supplier under one Sidebar section and route prefix — it did not unify them at the data or
component level; `CustomerForm.tsx` and Supplier's bespoke form remain fully separate, matching
ERPNext's own separate `Customer`/`Supplier` DocTypes (live-confirmed via `get_doctype_fields`, no
shared Party doctype exists in this ERPNext version). Unifying them would be
`REQUIRED_CEYLON_BEHAVIOR` for a native backend, not `FRAPPE_CURRENT_BEHAVIOR` today — remains an
open architecture decision in `docs/master-data-architecture.md` §10, not resolved here or by
anything shipped since this ADR was first recorded.
