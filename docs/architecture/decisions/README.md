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
