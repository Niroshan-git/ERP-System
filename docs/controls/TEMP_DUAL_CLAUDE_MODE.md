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

**Ambiguity note (added 2026-09-20 housekeeping, CX-MFG-PP2-003):** the rows above label roles by
account (`CLAUDE-A`/`CLAUDE-B`) only — they do not carry a durable session identifier, and `CLAUDE-A`
was also used informally in conversation for the session that reviewed and accepted PP-2. This note
does not reinterpret or rewrite the rows; it flags the ambiguity and points to §18 for the fix
applied to future assignments.
