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
2. **Review status, corrected 2026-09-22 (MD-R1 remediation pass).** **Package 4A** (read-only
   list/detail) was never independently reviewed at all, in any form. **Package 4B** (create +
   Draft-edit) *was* independently reviewed — by Codex, 2026-09-19, same day it shipped — and
   returned `CHANGES REQUIRED` with 3 findings (`CX-MFG-BOM-4B-001` HIGH, `CX-MFG-BOM-4B-002`
   MEDIUM, `CX-MFG-BOM-4B-003` HIGH/security). `6c38f7b`, the same-day remediation, fixed the two
   functional findings (submitted-BOM availability, Draft view/edit split); `CX-MFG-BOM-4B-003`
   (an exposed Administrator API credential) remained `ACTION REQUIRED` until the Product
   Owner/operator confirmed the credential's rotation/revocation on 2026-09-22 — see
   `docs/operations/AI_WORK_LOG.md`'s matching entry. **No re-review of `6c38f7b` by Codex or a
   cross-account session has ever happened.** A separate independent review (`MD-R1`, 2026-09-22)
   then reviewed the whole package fresh and returned its own `CHANGES REQUIRED` (one new MEDIUM
   code finding, now fixed by this remediation pass, plus `CX-MFG-BOM-4B-003` which was still open
   at review time); **`MD-R1` itself remains `CLAUDE_HANDOFF`, not self-declared `ACCEPTED`** — it
   awaits independent re-review of this remediation. This is why
   `docs/ceylon-stack-documentation.html` correctly keeps BOM at "Building," not "Live." Treat BOM's
   frontend as shipped-but-not-yet-independently-accepted.
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
