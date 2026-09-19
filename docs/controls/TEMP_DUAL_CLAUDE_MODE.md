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

## Session Log

Record each session's account assignment and package here so a fresh session/account can
reconstruct state without re-pasting this protocol.

| Date | Account | Role | Package | Base Commit | Result |
|---|---|---|---|---|---|
| 2026-09-20 | CLAUDE-B | REVIEWER | Production Plan PP-1 | `2e9f8da` | ACCEPTED, 2 non-blocking findings (`PP1-B-01`, `PP1-B-02`) — see `AI_WORK_LOG.md` |
| 2026-09-20 | CLAUDE-B | IMPLEMENTER | Production Plan PP-2 | `2e9f8da` | `CLAUDE_HANDOFF` — awaiting CLAUDE-A/Codex review, not self-accepted — see `AI_WORK_LOG.md` |
