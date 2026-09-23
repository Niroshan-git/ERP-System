# TEMPORARY: Dual-Claude Development Mode

## Authorization record (added 2026-09-20, post-hoc)

This document and the CLAUDE.md paragraph wiring it in as binding were both introduced in commit
`839110a` — the same commit as the Production Plan PP-2 feature they exist to govern review of —
with no independent evidence in that commit's message, `AI_WORK_LOG.md`, or elsewhere in the repo
that Niroshan actually authorized suspending the Codex-review requirement, or that Codex being
unavailable was anything more than the implementing session's own unverified assertion. An
independent reviewing session (acting as CLAUDE-A, reviewing PP-2 per protocol) correctly caught
this gap and declined to issue a binding verdict under an unverified protocol, escalating instead —
exactly what protocol §2 ("repository is authoritative, not conversational claims") asks for. That
review is itself the correct behavior, not a process failure.

Niroshan confirmed directly, in conversation with the implementing session on 2026-09-20, that
this dual-Claude stand-in was his intentional decision and that Codex is genuinely unavailable
during the effective period below. This entry exists so that fact is repository evidence, not
only something one chat session witnessed — per this document's own §2/§15, a session should not
have to trust another session's unverifiable claim about authorization.

**Status: TEMPORARY / TIME-BOXED.** This document is binding only for its effective period below,
and only supersedes the Claude↔Codex model in `AI_DUAL_AGENT_OPERATING_MODEL.md` /
`AI_AGENT_HANDOFF_POLICY.md` for the independent-review role specifically. Every other binding
document in `docs/controls/` (architecture, sequencing, package-closure rules, Current Mission
lock) remains in force unchanged.

## Effective Period

2026-09-20 through 2026-09-25 (while Codex independent-review capacity is unavailable).
Expected return to normal Claude → Codex governance: 2026-09-26.

## Why This Exists

Codex is temporarily unavailable as the independent reviewer. Rather than let implementation
packages go unreviewed, or self-review (which `AGENT_OPERATING_GUIDE.md`/`AI_DUAL_AGENT_OPERATING_MODEL.md`
already prohibit), two independent Claude accounts — **CLAUDE-A** and **CLAUDE-B** — stand in for
implementer/reviewer roles, each never reviewing its own package.

## 1. Operating Model

Both accounts may implement. Both accounts may review. **No account may review or accept its own
implementation package.** Cross-review is mandatory.

## 2. Repository Is Authoritative

Do not rely solely on prompts, memory, or another agent's claims. Before substantial work, inspect
the repository: `AI_WORK_LOG.md`, Current Mission, canonical backend docs, package-specific docs,
and Git history are authoritative. If prompt information conflicts with repository evidence,
investigate before proceeding — never silently prefer the prompt.

## 3. Development Ownership

Every package has exactly one implementation owner (`IMPLEMENTER: CLAUDE-A` or `CLAUDE-B`, never
both). No two accounts modify the same package.

## 4. Package Isolation

One bounded package per assignment. Before implementation, record: PACKAGE, IMPLEMENTER, REVIEWER,
BASE COMMIT, SCOPE, EXPECTED OUTPUT. No unrelated modules or opportunistic refactoring. Current
Mission Priority Lock still applies.

## 5. Implementer Mode

First inspect: repo status, branch, recent commits, governance, Current Mission, existing
implementation, backend docs, live ERPNext behavior where applicable. Implementer owns
investigation, verification, implementation, testing, documentation, and produces a
`CLAUDE_HANDOFF` — never a self-declared `PACKAGE ACCEPTED`. Acceptance belongs exclusively to the
other account during this mode.

## 6. Reviewer Mode

Do not trust the handoff as proof. Independently establish the actual package boundary from Git
evidence (base commit, implementation commit, changed files, unstaged changes, isolation), then
independently review.

## 7. Review Areas

Architecture (headless boundary, no ERPNext core edits), ERPNext/Frappe compatibility (DocTypes,
lifecycle, permissions, stock/accounting behavior — not accepted merely because documented),
frontend (routes/actions/forms/validation/UX), data integrity, financial/stock impact, security,
documentation accuracy (`NEEDS_VERIFICATION` where unverified), regression risk.

## 8. Review Findings

Classify `HIGH` / `MEDIUM` / `LOW`. `HIGH` blocks acceptance (incorrect ERPNext/accounting/stock
behavior, destructive lifecycle behavior, security issue, broken core workflow, architecture
violation, data-integrity issue). `MEDIUM` should normally be remediated before acceptance. `LOW`
is non-blocking unless it accumulates into material risk.

## 9. Review Result

Exactly one of `ACCEPTED` or `CHANGES REQUIRED` — no ambiguous states.

## 10. Remediation Loop

Original implementer owns remediation unless ownership is explicitly transferred. Reviewer
re-reviews the actual remediation commit, not the implementer's explanation of it.

## 11. Parallel Development

Both accounts may work in parallel only on genuinely independent packages that don't touch shared
areas (Sidebar, centralized ERPNext API layer, shared types/components, master data, permissions,
architecture docs). Where a dependency exists: finish → review → accept → begin dependent package.

## 12. Token Management

Token limits never drive architectural decisions. On approaching a limit: finish the current
bounded package where practical, commit cleanly, produce the standard handoff, transfer to the
other account. Durable knowledge lives in the repo and committed documentation, not conversational
summaries.

## 13. Prompt Generation

Either account may help draft the next implementation/review prompt. A generated prompt is an
instruction layer only, not authoritative project state, and does not confer ownership — it must
be reconciled against the repository before execution.

## 14. Mandatory Package Header

Every package: PACKAGE / ROLE / AGENT / IMPLEMENTER / REVIEWER / BASE COMMIT / TARGET.

## 15. Context Reset Protection

At the start of a new session, do not assume prior chat context is complete. Reconstruct: Current
Mission, last accepted package, current package, implementer, reviewer, package status, next
allowed action — from the repository, then continue.

## 16. Codex Return (2026-09-26)

On Codex's return: stop using Claude as independent acceptance authority. Codex performs a
reconciliation audit of packages accepted during this mode (implementer/reviewer accounts,
commits, remediation commits, acceptance state, unresolved findings, backend/architecture
documentation changes) and determines whether additional remediation is needed. Do not
automatically rewrite previously accepted packages — audit first.

## 17. Core Rule

Build with one account. Review with the other. Trust the repository, not the conversation. Commit
knowledge, not just code. Never self-accept. Do not sacrifice package isolation for speed.

## 18. Durable Audit Identity Convention (prospective, added 2026-09-20 housekeeping — CX-MFG-PP2-003)

The `CLAUDE-A` / `CLAUDE-B` labels used through PP-2 identify which of the two independent Claude
accounts held a role, but not which specific session of that account did the work — and the same
two labels have also been used informally in conversation as shorthand for "Account A" / "Account
B" across sessions. That is ambiguous for audit purposes.

**Prospectively — from this housekeeping package onward — every package assignment must record:**

```
IMPLEMENTER:
  Account/role label (e.g. CLAUDE-A) + a durable session identifier, if the environment exposes
  one. If it doesn't, record "no durable session identifier available" rather than inventing one.

REVIEWER:
  Same format as IMPLEMENTER, for the reviewing account/session.

PACKAGE:
  Package ID (e.g. PP-3).

ASSIGNED BY:
  Niroshan.

ASSIGNMENT TIMESTAMP:
  Date/time the assignment was made.
```

This adds a session identifier alongside the existing `CLAUDE-A`/`CLAUDE-B` account-role labels —
it does not replace them, and it does not reclassify or rewrite the historical Session Log below.
Where no durable session identifier exists, the commit hash and timestamp remain the disambiguating
evidence.

## Session Log

Record each session's account assignment and package here so a fresh session/account can
reconstruct state without re-pasting this protocol.

| Date | Account | Role | Package | Base Commit | Result |
|---|---|---|---|---|---|
| 2026-09-20 | CLAUDE-B | REVIEWER | Production Plan PP-1 | `2e9f8da` | ACCEPTED, 2 non-blocking findings (`PP1-B-01`, `PP1-B-02`) — see `AI_WORK_LOG.md` |
| 2026-09-20 | CLAUDE-B | IMPLEMENTER | Production Plan PP-2 | `2e9f8da` | `CLAUDE_HANDOFF` — awaiting CLAUDE-A/Codex review, not self-accepted — see `AI_WORK_LOG.md` |
| 2026-09-20 | this session, no durable session identifier available | IMPLEMENTER | Production Plan PP-5 | `fcc04c5` | `CLAUDE_HANDOFF` — awaiting independent cross-review, not self-accepted — see `AI_WORK_LOG.md` |
| 2026-09-20 | a later session (post-`/clear`), no durable session identifier available, + `code-reviewer` subagent | REVIEWER | Production Plan PP-5 | `0a5719b` | **ACCEPTED** — no HIGH findings, 2 non-blocking LOW/MEDIUM observations — see `AI_WORK_LOG.md`'s "PP-5 — independent review" entry |
| 2026-09-20 | a later session (post-`/clear`), no durable session identifier available | IMPLEMENTER | Production Plan PP-6 | `812acae` | `CLAUDE_HANDOFF` — awaiting independent cross-review, not self-accepted — see `AI_WORK_LOG.md`'s "PP-6 — Material Request Generation" entry |
| 2026-09-20 | this session, no durable session identifier available | IMPLEMENTER | Production Plan PP-5R | `7bd2f6c` | `CLAUDE_HANDOFF` — awaiting independent cross-review, not self-accepted — see `AI_WORK_LOG.md`'s "PP-5R" entry |
| 2026-09-20 | a later session (post-`/clear`), no durable session identifier available | REVIEWER | Production Plan PP-5R | `5cd076e` | **ACCEPTED** — no HIGH findings, 1 non-blocking LOW finding (`PP5R-R-01`) — see `AI_WORK_LOG.md`'s "PP-5R — independent review" entry |
| 2026-09-20 | this session, no durable session identifier available | IMPLEMENTER (discovery) | Production Plan PP-7 | `34f6319` | `CLAUDE_HANDOFF` — source discovery complete, controlled runtime test blocked by sandbox permission classifier (no test data created), not self-accepted — see `AI_WORK_LOG.md`'s "PP-7 — Multi-Level BOM & Subassembly Runtime Qualification" entry |
| 2026-09-21 | this session, no durable session identifier available | IMPLEMENTER (runtime qualification) | Production Plan PP-7R | `5760875` | `CLAUDE_HANDOFF` — runtime qualification complete (existing implementation sufficient, no code changes), full fixture built/tested/cleaned up, docs corrected — awaiting independent cross-review to close PP-7 overall, not self-accepted, PP-8 remains locked — see `AI_WORK_LOG.md`'s "PP-7R — Controlled Multi-Level Runtime Qualification Continuation" entry |
| 2026-09-21 | a later session (post-`/clear`), no durable session identifier available | REVIEWER | Production Plan PP-7R | `746847a` | **ACCEPTED** — no HIGH findings, 1 non-blocking LOW finding (`PP7R-R-01`); **PP-7 overall CLOSED/ACCEPTED**; PP-8 unlocked for planning only — see `AI_WORK_LOG.md`'s "PP-7R — independent review" entry |
| 2026-09-21 | this session, no durable session identifier available | IMPLEMENTER | Production Plan PP-8 — Cancel | `6da0255` | `CLAUDE_HANDOFF` — implementation authorized separately from the planning-only unlock; two previously-open `NEEDS_VERIFICATION` items (Submitted Work Order, Draft Material Request) live-tested and resolved; awaiting independent cross-review, not self-accepted — see `AI_WORK_LOG.md`'s "PP-8 — Cancel" entry |
| 2026-09-21 | a later session (post-`/clear`), no durable session identifier available | REVIEWER | Production Plan PP-8 — Cancel | `3dbe565` | **ACCEPTED** — no HIGH/CRITICAL findings, 1 non-blocking LOW finding (`CX-MFG-PP-8-001`); SOURCE VERIFIED/NOT RUNTIME VERIFIED and NEEDS_VERIFICATION classifications preserved — see `AI_WORK_LOG.md`'s "PP-8 — Cancel — independent review" entry |
| 2026-09-21 | this session, no durable session identifier available | IMPLEMENTER | Work Order — Submit (`MFG-WF-004`) | `9357fec` | `CLAUDE_HANDOFF` — awaiting independent cross-review, not self-accepted; code review + QA both PASS in-session, one disclosed QA governance finding (unauthorized live-document substitution, resolved with Niroshan) — see `AI_WORK_LOG.md`'s "Work Order — Submit" entry |
| 2026-09-21 | this session, no durable session identifier available | IMPLEMENTER | Manufacturing Flow map (+ Sales/Manufacturing Flow generalization) | `d5386bc` | `CLAUDE_HANDOFF` — awaiting independent cross-review, not self-accepted; first pass forked components (self-caught blocking finding via in-session `code-reviewer`, `FRONTEND_GUIDE.md` §7 violation), remediated into shared `FlowMap`/`FlowNodeDialog`, second review PASS confirming fix and no Sales Flow regression; visual rendering not verifiable in this environment (no browser tool) — see `AI_WORK_LOG.md`'s "Manufacturing Flow map" entry |
| 2026-09-22 | this session, no durable session identifier available | IMPLEMENTER | Buying Flow + Inventory Flow maps | `689d515` | `CLAUDE_HANDOFF` — awaiting independent cross-review, not self-accepted; built directly in the already-fixed RSC-safe shape (no repeat of the Manufacturing Flow map's first-pass mistake), in-session `code-reviewer` PASS with no blocking findings; visual rendering not verifiable in this environment (no browser tool, no test login credentials) — see `QA_LOG.md`'s "Buying Flow + Inventory Flow maps" entry |
| 2026-09-22 | this session, no durable session identifier available | IMPLEMENTER | Company Workflow flow map + Inventory module card fix | `7bbdc69` | `CLAUDE_HANDOFF` — awaiting independent cross-review, not self-accepted; new node-ordering combining already-proven edge segments (arithmetic independently re-verified by `code-reviewer`), one non-blocking content nit fixed, Inventory-card piggyback explicitly reviewed and judged reasonable not scope creep; visual rendering not verifiable in this environment (no browser tool, no test login credentials) — see `QA_LOG.md`'s "Company Workflow flow map + missing Inventory module card" entry |
| 2026-09-22 | this session, no durable session identifier available | IMPLEMENTER | Sale to Cash scene (Company Workflow tab) | `efd0998` | `CLAUDE_HANDOFF` — awaiting independent cross-review, not self-accepted; second scene added to the same data/component pair using the established multi-scene pattern, geometry and cross-scene shortcuts independently re-verified by `code-reviewer`, one non-blocking content nit fixed; visual rendering not verifiable in this environment (no browser tool, no test login credentials) — see `QA_LOG.md`'s "Sale to Cash scene added to the Company Workflow tab" entry |
| 2026-09-22 (retroactive backfill, see note below) | unknown / reconstructed — no session identifier or Session Log row exists; identified only by Git commit authorship (Niroshan Lakmal) and the `Co-Authored-By: Claude Sonnet 5` trailer | IMPLEMENTER | Architecture/master-data baseline adoption | `0e27f80` | `caf1a46` committed with no contemporaneous Session Log row; not independently reviewed as its own package, only inspected as read-only baseline context by the MD-R2 review below — see `AI_WORK_LOG.md`'s "Architecture/master-data baseline adoption + MD-R2 backend-knowledge capture" entry |
| 2026-09-22 (retroactive backfill, see note below) | unknown / reconstructed — same evidentiary gap as the row above | IMPLEMENTER | MD-R2 — Master Data Backend Knowledge Capture | `caf1a46` | `5d291db` committed with no contemporaneous Session Log row; independently reviewed below and **ACCEPTED** — see `AI_WORK_LOG.md`'s same entry |
| 2026-09-22 | this session, no durable session identifier available | REVIEWER | MD-R2 — Master Data Backend Knowledge Capture (independent review) | `5d291db` | **ACCEPTED** — no CRITICAL/HIGH findings; 2 MEDIUM (F1 missing traceability, F2 stale "01-master-data/ does not exist" claims), 1 LOW (F4 confusing migration-status.md wording), 1 INFO (F5 MD-UNV-003 status-tag clarity); `MD-UNV-003` independently re-derived and confirmed Verdict A (real frontend gap) via repo-wide grep, not trusted from the document — see `AI_WORK_LOG.md`'s same entry for the full report reference |
| 2026-09-22 | this session, no durable session identifier available | IMPLEMENTER | MD-R2 closure & documentation sync (governance/doc-only) | `5d291db` (review boundary) | Remediated F1 (this row + `AI_WORK_LOG.md` + `PROGRESS.md` backfill), F2 (stale "does not exist" claims corrected in `docs/master-data-architecture.md`, `docs/architecture/decisions/README.md`, `docs/ceylon-stack-master-backlog.md`), F4 (`migration-status.md` reworded, no meaning change), F5 (`MD-UNV-003` reworded to separate CONFIRMED GAP from NEEDS PRODUCT DECISION); did not touch application code/routes/`Sidebar.tsx`, did not resolve `MD-UNV-003`, did not begin `MD-R1`/CRM/Finance/any new Master Data feature; not self-accepted as independently reviewed |
| 2026-09-22 | this session, no durable session identifier available | REVIEWER | MD-R1 — BOM independent review (`ad8ad92`/`305ccd7`/`6c38f7b`) | `406cc72` | **CHANGES REQUIRED** — carried-forward `CX-MFG-BOM-4B-003` (HIGH, security: exposed Administrator API credential, still `ACTION REQUIRED` per every prior record, independently re-verified as still unresolved — no rotation evidence anywhere in the repo) plus one new MEDIUM code finding (Operations tab "Hourly Rate" column displays `base_hour_rate` instead of `hour_rate`, silently diverging from the create/edit form's identically-labeled field for any BOM priced in a non-company currency — masked today only because the one real BOM's currency equals company currency); 2 LOW documentation/comment-accuracy findings (stale "read-only only" comments in `Sidebar.tsx`/`masterDataWorkspace.ts`; "never received independent review" undersells that Package 4B was in fact reviewed once and found deficient). Architecture/ERPNext-model/list/detail/create/child-table/cross-module/server-boundary review otherwise found no CRITICAL/HIGH code defects — see `AI_WORK_LOG.md`'s matching entry for full evidence. Review-only: no application code, route, or documentation content modified; findings not remediated, per the review's own scope |
| 2026-09-22 | this session, no durable session identifier available | IMPLEMENTER | MD-R1 BOM remediation (F-BOM-01/02/03/04) | `0b3bfe6` | `CLAUDE_HANDOFF` — narrow fix of exactly the 4 findings from the MD-R1 review: F-BOM-01 (MEDIUM, fixed — BOM detail Operations tab now shows `hour_rate` not `base_hour_rate`, traced end-to-end from `BomOperationsEditor.tsx` through `bomRows.ts` to the detail page, no costing/conversion logic touched); F-BOM-02 (HIGH, security — recorded `RESOLVED` per **explicit operator confirmation this turn** that the exposed Administrator API credential was rotated/revoked; not independently re-verified by this session, no secret value recorded anywhere, original Codex findings table left unmodified as historical record); F-BOM-03 (LOW, fixed — stale "read-only only" comments corrected in `Sidebar.tsx`/`masterDataWorkspace.ts`, comment-only, no navigation change); F-BOM-04 (LOW, fixed — historical review-state corrected in `docs/backend/01-master-data/{bom.md,README.md}` and `docs/master-data-architecture.md`, unrelated history left untouched). Submitted-BOM availability actions remain `NEEDS_VERIFICATION` — no live-write testing performed, not falsely closed. `npx tsc --noEmit`/`npx eslint` (scoped)/`npm run build` all clean; `.env` confirmed still gitignored/untracked, contents never read. Not self-accepted — awaiting independent re-review; no new package started — see `AI_WORK_LOG.md`'s matching entry |
| 2026-09-22 | this session, no durable session identifier available (same session as every MD-R1 row above — see disclosure below) | REVIEWER (targeted re-review, then final closure) | MD-R1 — targeted re-review + final governance closure | `23886ac` | **ACCEPTED** — two-part pass. Targeted re-review independently re-traced F-BOM-01 (field path confirmed consistent), F-BOM-02 (record accurately discloses operator-confirmed, not Claude-verified, closure; no secret in diff), F-BOM-03 (comment-only, route unchanged), F-BOM-04 (chronology internally consistent); no new CRITICAL/HIGH found; flagged 3 known stale docs as separate, non-blocking LOW debt. Final closure then independently re-verified all four findings fresh a second time, corrected the 3 flagged docs plus `docs/master-data-architecture.md` and `docs/backend/01-master-data/README.md` (found not in the original 3-file list but self-contradictory to leave stale), and recorded acceptance as a new dated event without altering the original `CHANGES REQUIRED` historical records. **Governance disclosure:** this and the immediately preceding review row were performed by the same session as the original MD-R1 review and its remediation — no genuinely separate Claude account/session was invoked; none exists in this environment. The assigning brief explicitly acknowledged this and directed closure to proceed on that basis. This does not satisfy this document's own "no account may review or accept its own implementation package" rule in its literal cross-account sense — flagged as a candidate for Codex's §16 reconciliation audit on its return. See `AI_WORK_LOG.md`'s matching entry for full detail |
| 2026-09-22 | this session, no durable session identifier available (same environment lineage as the packages under review — see disclosure below) | REVIEWER (`MFG-WF-004`, Manufacturing Flow map) + INVESTIGATOR (BOM production eligibility) | MFG-CLOSE-0a / 0b — Manufacturing governance closure + BOM eligibility verification | `73de4b4` | `MFG-WF-004` **ACCEPTED** (no blocking findings; one pre-existing, non-regressing `verifySession` inconsistency noted, not remediated). Manufacturing Flow map **CHANGES REQUIRED** (one MEDIUM: `materialTransfer` node's `href` points at `/stock/stock-entries`, which explicitly excludes the Manufacture-purpose Stock Entry the node describes — the real route is the Work-Order-nested `/manufacturing/work-orders/[name]/transfer-materials`; not fixed here, review-only). BOM eligibility resolved as **Scenario C, live-verified via a disposable throwaway fixture** (created/tested/cleaned up in one non-committed transaction, independently re-confirmed absent afterward): direct Work Order creation hard-blocks a Draft BOM (`validate_bom_no()` in `WorkOrder.validate()`, live-reproduced `ValidationError`); Production-Plan-generated Work Orders bypass this entirely via native `ignore_validate`/`ignore_mandatory` flags in `ProductionPlan.create_work_order()` (also live-reproduced); `ProductionPlan.validate_data()` itself is dead code in this installed version (zero callers anywhere in `erpnext`). Conclusion: `BOM SUBMIT IS A CONFIRMED MANUFACTURING V1 BLOCKER` for the direct-create path specifically (Ceylon Stack's own BOM frontend has no Submit/Cancel action at all) — `MFG-CLOSE-0c — BOM Submit` scoped as the necessary next package before `MFG-CLOSE-1`. F-BOM-02 credential rotation still not independently verifiable (old credential value never recorded, correctly, so nothing to test against without retrieving it — declined to do so) — left exactly as previously classified. **Governance disclosure, same as the row above:** no genuinely separate Claude account/session exists in this environment; this review's rigor rests on independent evidence (git diff, live source tracing via SSH, live-tested-and-cleaned-up fixtures) rather than cross-account separation — flagged for Codex's §16 reconciliation audit. See `AI_WORK_LOG.md`'s matching entry for full detail |
| 2026-09-22 | this session, no durable session identifier available | IMPLEMENTER | Manufacturing Flow map `materialTransfer` href remediation (Stage 1 of the MFG-CLOSE-0a/0c mission) | `73de4b4` | `CLAUDE_HANDOFF` — isolated one-file fix for the single MEDIUM finding from this same session's own MFG-CLOSE-0a review row above; `href` changed `/stock/stock-entries` → `/manufacturing/work-orders` plus a corrected `note`, no dynamic per-Work-Order URL invented (none constructible at that scope). `tsc`/`eslint`/`build` all clean; diff isolated to `lib/manufacturingFlowMap.ts` + `QA_LOG.md`/`AI_WORK_LOG.md`. Deliberately committed separately from `MFG-CLOSE-0c` per the assigning brief's explicit two-stage instruction — awaiting independent cross-review, not self-accepted |
| 2026-09-22 | this session, no durable session identifier available | IMPLEMENTER | MFG-CLOSE-0c — BOM Submit | `de99b55` | `CLAUDE_HANDOFF` — new `submitBomAction` (`submitDoc("BOM", name)`, re-fetch-and-check-`docstatus` guard, same shape as this file's existing `updateBomAction`/`setBomAvailability`) plus a "Submit BOM" `DocActionBar` on `/master-data/boms/[name]`. Live E2E acceptance test (disposable Item/BOM fixture, one non-committed transaction, independently re-confirmed absent afterward): Draft BOM → submit → `docstatus 1`, `Item.default_bom` auto-set live-confirmed (native `manage_default_bom()`, not requested by this action) → direct Work Order creation succeeded with **zero** `ignore_validate`/bypass flags → Production Plan → Make Work Order regression against the same submitted BOM also succeeded. `tsc`/`eslint`/`build` all clean. `bom.md` new "Submit contract" section + stale-claim corrections; `docs/backend/05-manufacturing/README.md` two stale "investigated only" claims corrected. Foreign `unverified-behaviours.md`/`PROGRESS.md` not touched. No Cancel/Amend/Manufacture Stock Entry/other locked scope touched — awaiting independent cross-review, not self-accepted |
| 2026-09-22/23 | this session, no durable session identifier available | IMPLEMENTER | MFG-CLOSE-1 — Complete Production / Manufacture Stock Entry | `ca3cd5e` | `CLAUDE_HANDOFF` — new `/manufacturing/work-orders/[name]/complete-production` calling native `make_stock_entry(purpose="Manufacture")`, mirroring Material Transfer's trust boundary with zero client-editable item rows (no ERPNext "additional item" mechanism exists for this purpose, source-confirmed). `devops` subagent SSH-investigated the native source read-only first, then live-executed a full disposable-fixture E2E QA pass (`bench execute`, not `bench console` piping) covering full production, partial production (discovered `MFG-STK-009`: status stays "Not Started" after partial production — correct, not a bug), over-production rejection (corrected the original source-only claim about *where* this is enforced — `Stock Entry.validate()`/insert time, not `Work Order.update_work_order_qty()`/submit time), and a Draft-Work-Order attempt (confirmed `canCompleteProduction()`'s `docstatus` gate is this app's own safeguard, not ERPNext-redundant) — all against disposable data, fully cleaned up, independently re-confirmed absent; the 4 real Work Orders untouched throughout. In-session `code-reviewer` found and this session fixed one real gap (batch/serial guard fail-opened on an Item-lookup error). `tsc`/`eslint`/`build` all clean. New `docs/backend/05-manufacturing/manufacture-completion.md`; `work-order.md`/`README.md`/`migration-status.md` updated. Foreign `unverified-behaviours.md`/`PROGRESS.md`/`master-data-architecture.md`/the new `party-contact-address-architecture.md` not touched. Commits `2454d74`, `428ac4a` (code) + a following documentation/QA-log commit. No Work Order Cancel/BOM Cancel/Job Card/Workstation/OEE/other locked scope touched — `MFG-CLOSE-2` remains locked, awaiting independent cross-review, not self-accepted |
| 2026-09-23 | this session (fresh session, launched under a new "Manufacturing Floor Full Completion" master mission), no durable session identifier available | IMPLEMENTER (closure of a pre-existing uncommitted diff, not new implementation) | MFG-CLOSE-2 — BOM Cancel/Amend | `2200cad` | `CLAUDE_HANDOFF` — found a fully-coded, uncommitted BOM Cancel/Amend feature at session start (`cancelBomAction`/`amendBomAction`/`page.tsx`/`connections.ts`'s new `BOM` entry) built by an earlier session with zero review/QA/documentation/logging — a real process gap, not fabricated history. Ran the full closure loop cold: in-session `code-reviewer` (no CRITICAL/HIGH code findings; one BLOCKING doc-only finding — `bom.md`'s "Cancel/Amend contract" section was cited by the code's own comments but did not exist), then `devops` subagent source-verification (live v16.34.2 SSH read confirming BOM cancel is blocked by two independent mechanisms — `validate_bom_links()` sub-assembly check and Frappe's generic `check_no_back_links_exist()`) plus live E2E QA against 3 disposable fixture passes (Draft-WO-doesn't-block, Submitted-WO-blocks-then-unblocks, sub-assembly-blocks-then-unblocks), all cleaned up and independently re-confirmed absent — the 4 real Work Orders and 1 real BOM untouched throughout. Corrected one factual error in the implementation's own doc-comment (amended-BOM naming mechanism) with no functional code change. `tsc`/`eslint`/`build` all clean. Wrote `bom.md`'s new "Cancel/Amend contract" section plus stale-line corrections in `bom.md`/`README.md`/`migration-status.md`. Foreign uncommitted `unverified-behaviours.md`/`PROGRESS.md`'s MD-UNV-003 hunk/`master-data-architecture.md`/`party-contact-address-architecture.md` (a separate, unrelated Master Data package already sitting uncommitted at session start) not touched — commit isolated via partial staging to exclude those hunks. Flagged to Niroshan: the master mission's instruction to continue through the full Manufacturing package sequence in one session conflicts with this document's mandatory independent-cross-review-before-next-package rule and `AGENT_USAGE_POLICY.md`'s one-package-per-session default — proceeding one package at a time instead, per `CLAUDE.md`'s Enforcement section. No Work Order Cancel/Job Card/Workstation/OEE/other locked scope touched — awaiting independent cross-review, not self-accepted |

**Retroactive backfill note (added during the MD-R2 closure pass, 2026-09-22):** the two `caf1a46`/
`5d291db` rows above were reconstructed after the fact, not recorded at implementation time — a real
process gap (Finding F1 of the MD-R2 independent review), not a historical fact being invented here.
Per this closure pass's own instruction, no `CLAUDE-A`/`CLAUDE-B` account label or exact assignment
timestamp is asserted for either row beyond what Git evidence supports (commit author, commit
timestamp, `Co-Authored-By` trailer) — see `AI_WORK_LOG.md`'s corresponding entry for the full
evidentiary basis.

**Ambiguity note (added 2026-09-20 housekeeping, CX-MFG-PP2-003):** the rows above label roles by
account (`CLAUDE-A`/`CLAUDE-B`) only — they do not carry a durable session identifier, and `CLAUDE-A`
was also used informally in conversation for the session that reviewed and accepted PP-2. This note
does not reinterpret or rewrite the rows; it flags the ambiguity and points to §18 for the fix
applied to future assignments.
