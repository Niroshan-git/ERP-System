# BOM — Cross-Reference, Not a Duplicate

**Status:** `VERIFIED` (cross-reference confirmed against the current repository, 2026-09-22).

BOM (`BOM` DocType) is canonical **Master Data** by product/route classification —
`docs/architecture/decisions/README.md` ADR-007 and `docs/master-data-architecture.md` both
classify it under the "Manufacturing Masters" group of the Master Data domain, and its frontend
route is `/master-data/boms` (list), `/master-data/boms/[name]` (detail),
`/master-data/boms/new` (create) — confirmed live in `apps/frontend/src/app/(app)/master-data/boms/`.

**Its full canonical entity documentation already exists and is not duplicated here.** BOM was
investigated and documented in depth on 2026-09-19, before this `01-master-data/` domain folder
existed, under `docs/backend/05-manufacturing/bom.md` (405 lines) — written when BOM was still
treated as a Manufacturing-domain concept. Per `docs/controls/BACKEND_KNOWLEDGE_POLICY.md` §5's
own instruction ("update the existing document, don't duplicate it"), that document remains BOM's
canonical backend-knowledge home. It already covers, in depth: Identity/naming, status/configuration
fields, document lifecycle (including the 2026-09-19 Codex-verified lifecycle/availability rules),
the `BOM Item` and `BOM Operation` child tables, other unread child tables, Costing, `BOM Creator`,
Item relationships, multi-level/nested BOM (schema-confirmed, not behavior-verified), Work Order and
Production Plan relationships, the stock/accounting boundary, Operation/Routing/Workstation
classification, frontend capability (Package 4A), and the full mutation contract + submitted-BOM
availability contract (Package 4B + its remediation).

See: [`docs/backend/05-manufacturing/bom.md`](../05-manufacturing/bom.md).

## What this cross-reference adds that the Manufacturing-side document does not

1. **Domain classification.** BOM is Master-Data-owned for navigation/route purposes (§4 of
   `docs/master-data-architecture.md`'s Canonical Ownership Rule) even though its backend knowledge
   document lives under `05-manufacturing/`. This is a deliberate split — route ownership and
   documentation location are not required to match 1:1, and forcing a file move here would
   duplicate 405 lines of already-accepted content for no informational gain. Update
   `05-manufacturing/bom.md` in place for any future BOM behavior change; do not fork a second copy
   here.
2. **Review status, current as of this package (MD-R2, 2026-09-22).** BOM Package 4A (read-only
   list/detail) and Package 4B (create + Draft-edit) are both shipped in code and passed in-session
   `code-reviewer`/`qa-tester` checks, but **neither has ever received independent (Codex or
   cross-account) review** — confirmed via `docs/operations/AI_WORK_LOG.md`, where both packages
   remain `CLAUDE_HANDOFF` with no later acceptance entry found. This is why
   `docs/ceylon-stack-documentation.html` correctly keeps BOM at "Building," not "Live." Treat BOM's
   frontend as shipped-but-not-release-ready. The recommended next Master Data package
   (`docs/master-data-architecture.md` §9, MD-R1) is exactly this independent review — this
   cross-reference document does not perform it.
3. **Master Data ownership-matrix entry** — for the summary table in
   `01-master-data/README.md`, so BOM appears alongside the other 9 priority DocTypes in this
   package's scope without its content being copied here.

## NEEDS_VERIFICATION carried forward (not new, not re-litigated here)

`docs/backend/05-manufacturing/bom.md` and `docs/backend/99-unverified/unverified-behaviours.md`
already carry BOM's open items under their existing permanent IDs — `MFG-UNV-009` (lifecycle,
multi-level explosion, costing recompute), `MFG-UNV-010` (status-tone mapping, authenticated route
walkthrough), `MFG-UNV-011` (non-Draft update rejection, zero-rate component acceptance). This
package does not reassign or duplicate those IDs (per the resolved `CX-MD-BOM-001` collision
history in `docs/operations/AI_WORK_LOG.md`) — see this domain's own `unverified-behaviours.md`
entries (`MD-UNV-*`) for what's new in this package instead.
