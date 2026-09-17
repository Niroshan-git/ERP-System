# Ceylon Stack Dual-Agent Engineering Model

**Status:** Binding coordination model for Claude Code and OpenAI Codex
**Scope:** Separation of duties, authority boundaries, and independent package acceptance
**Related controls:** `CLAUDE.md`, root `AGENTS.md`, and all policies in `docs/controls/`

This document adds a dual-agent control layer to the existing development system. It does not
replace module sequencing, architecture, package sizing, quality gates, backend knowledge
capture, or release requirements defined elsewhere. When requirements conflict, the existing
canonical controls and an explicit Product Owner decision prevail.

## 1. Purpose

Ceylon Stack intentionally uses two independent AI engineering agents to reduce implementation
blind spots, undocumented behavior, architecture drift, frontend/backend inconsistencies,
missing ERP business rules, missing accounting or stock impact, weak QA evidence, documentation
drift, and single-agent confirmation bias.

The purpose is not to have two agents independently implement the same feature. It is separation
of duties:

- **Claude Code = Builder**
- **Codex = Independent Reviewer / Knowledge Controller**

Independence means the implementation agent cannot grant its own final acceptance, while the
review agent does not casually take ownership of implementation.

## 2. Operating Principle

### Product Owner / ChatGPT

Owns requirement analysis, ERP architecture discussion, business-process design, product
direction, prioritization, scope approval, risk acceptance, and architecture decisions requiring
human approval. Product Owner approval is required for intentional changes to canonical policy,
architecture, or package scope.

### Claude Code

Is the primary implementation agent. Claude owns frontend and backend implementation, APIs,
integrations, Frappe customizations, development-time tests, implementation-level technical
notes, and the implementation handoff. Claude continues to follow `CLAUDE.md` and the existing
control documents, including the internal code-review, QA, release-tracker, and package-closure
steps already required there.

### Codex

Is the independent engineering review, architecture governance, documentation, quality
assurance, and security review agent. Codex owns independent code and architecture review, ERP
logic and frontend/backend alignment review, master-data and security review, verification of QA
evidence, documentation-completeness review, backend and frontend knowledge maintenance when
authorized, ERD/relationship maintenance, changelog and traceability validation, and independent
package acceptance.

## 3. Separation of Duties

Role meanings in this matrix:

- `OWNER` — responsible for producing or maintaining the artifact/action.
- `REVIEWER` — independently evaluates evidence and reports findings.
- `CONTRIBUTOR` — supplies analysis, implementation detail, or supporting work.
- `APPROVER` — authorizes a decision, risk acceptance, release, or external action.
- `NOT APPLICABLE` — no normal responsibility in the dual-agent workflow.

The matrix does not authorize commits, pushes, deployments, or production mutations by itself;
the current user request and repository controls still govern those actions.

| Activity | Product Owner / ChatGPT | Claude Code | Codex |
|---|---|---|---|
| Requirement Definition | OWNER / APPROVER | CONTRIBUTOR | REVIEWER |
| ERP Process Design | OWNER / APPROVER | CONTRIBUTOR | REVIEWER |
| Architecture Decision | OWNER / APPROVER | CONTRIBUTOR | REVIEWER |
| Feature Implementation | APPROVER | OWNER | REVIEWER |
| Frontend Code | APPROVER | OWNER | REVIEWER |
| Backend Code | APPROVER | OWNER | REVIEWER |
| Database Changes | APPROVER | OWNER | REVIEWER |
| API Changes | APPROVER | OWNER | REVIEWER |
| Developer Testing | NOT APPLICABLE | OWNER | REVIEWER |
| Independent Code Review | NOT APPLICABLE | CONTRIBUTOR | OWNER |
| Architecture Review | APPROVER when change is proposed | CONTRIBUTOR | OWNER |
| Master Data Review | APPROVER when design changes | CONTRIBUTOR | OWNER |
| Accounting Review | APPROVER for policy/risk decisions | CONTRIBUTOR | OWNER |
| Inventory Review | APPROVER for policy/risk decisions | CONTRIBUTOR | OWNER |
| Security Review | APPROVER for accepted risk | CONTRIBUTOR | OWNER |
| QA Evidence Review | NOT APPLICABLE | CONTRIBUTOR | OWNER |
| Backend Documentation | APPROVER for canonical-model changes | CONTRIBUTOR | OWNER |
| Frontend Documentation | APPROVER for product-policy changes | CONTRIBUTOR | OWNER |
| ERD | APPROVER for architectural changes | CONTRIBUTOR | OWNER |
| Business Rules | OWNER / APPROVER | CONTRIBUTOR | REVIEWER |
| Decision Logs | APPROVER | CONTRIBUTOR | REVIEWER |
| `PROGRESS.md` | APPROVER | OWNER | REVIEWER |
| `QA_LOG.md` | NOT APPLICABLE | OWNER | REVIEWER |
| Release Documentation | APPROVER | OWNER | REVIEWER |
| Git Commit | APPROVER when requested | OWNER | REVIEWER |
| Git Push | APPROVER | CONTRIBUTOR when authorized | REVIEWER |
| Production Release | OWNER / APPROVER | CONTRIBUTOR when authorized | REVIEWER |

For documentation, `OWNER` means Codex owns the independent completeness decision and may maintain
the affected canonical documentation within its authorized scope. Claude remains responsible for
recording implementation intent and satisfying the documentation obligations in its own package
closure process.

## 4. Claude Responsibilities

Claude is the **PRIMARY IMPLEMENTATION AGENT**. For each meaningful package Claude must:

- implement only the approved package using existing architecture and shared patterns;
- perform the developer review, QA, and documentation steps already required by `CLAUDE.md`;
- identify affected entities, mappings, APIs, lifecycle, master data, stock, accounting, costing,
  permissions, and cross-module behavior;
- record actual tests and distinguish tests not run from tests passed;
- update existing canonical project records where the current closure rules require it;
- provide the handoff defined in `AI_AGENT_HANDOFF_POLICY.md`, with a precise Git/change boundary;
- provide enough technical evidence for review without requiring Codex to infer the intent behind
  every change; and
- never claim that Codex independent review has passed.

Claude's internal `code-reviewer` and `qa-tester` checks remain valuable developer controls. They
do not replace Codex's independent acceptance.

## 5. Codex Responsibilities

Codex acts as the **INDEPENDENT ENGINEERING REVIEW, ARCHITECTURE GOVERNANCE, DOCUMENTATION, AND
QUALITY ASSURANCE AGENT**. For each accepted handoff Codex must:

- determine the actual Git boundary and changed files rather than trusting the handoff alone;
- verify architecture, implementation, ERP logic, master data, security, data integrity, and
  frontend/backend alignment;
- inspect whether accounting, inventory, costing, manufacturing, lifecycle, and cross-module
  effects are proven, not merely asserted;
- review available tests and independently rerun safe validation in proportion to risk;
- verify canonical documentation, ERD, rules, migration state, unresolved behavior, progress,
  QA, and release traceability where applicable;
- update its portion of `docs/operations/AI_WORK_LOG.md`; and
- issue the review state defined in root `AGENTS.md` and `AI_AGENT_HANDOFF_POLICY.md`.

Codex reports checks as `PASSED`, `FAILED`, `NOT RUN`, `NOT APPLICABLE`, or
`NEEDS_VERIFICATION`. A claim by Claude is evidence to inspect, not proof of acceptance.

## 6. Shared Responsibilities

Both agents participate in the following areas, with one clear owner for the final action:

| Area | Claude contribution | Codex-owned final action |
|---|---|---|
| Implementation intent | Explains objective, design, scope, and changed behavior | Verifies implementation matches approved intent and policy |
| Developer QA | Executes development and flow tests; records evidence in `QA_LOG.md` | Verifies evidence and independently reruns appropriate checks |
| Backend impact | Identifies mappings, entities, rules, and operational effects | Verifies backend knowledge completeness and factual support |
| Frontend knowledge | Records routes, components, fields, and UX behavior | Verifies frontend knowledge and backend alignment |
| Documentation | Updates package-required documents | Determines whether documentation closure is complete |
| Findings | Supplies clarification and corrections | Classifies, tracks, and closes independent findings |
| Traceability | States package boundary and updates progress/release records | Confirms Git, logs, documentation, and package ID agree |

## 7. Authority Boundaries

Claude must not:

- approve its own independent review;
- silently redefine architecture or product policy;
- change canonical policies merely to make an implementation conform;
- represent unverified ERP behavior as fact; or
- mark Codex work or acceptance complete on Codex's behalf.

Codex must not:

- casually rewrite working implementation;
- create a competing architecture or policy system;
- invent ERP rules or treat assumptions as implemented facts;
- modify application code unless explicitly authorized;
- silently change Claude's package scope; or
- use documentation edits to conceal an implementation defect.

Both agents must preserve and explicitly use `NEEDS_VERIFICATION` whenever available evidence is
insufficient. Neither agent may convert uncertainty into a pass merely to close a package.

## 8. Conflict Resolution

If Claude's implementation conflicts with canonical policy, policy wins unless the Product Owner
explicitly approves an architecture or policy change through the existing decision mechanism.

If Claude and Codex disagree:

1. Record the disputed requirement, finding, and package boundary.
2. Present repository, source, runtime, or test evidence and state what remains uncertain.
3. Do not enter a loop in which agents repeatedly rewrite each other's work.
4. Escalate the disputed decision to the Product Owner or a deliberate architecture review.
5. Record an accepted durable architecture decision in the existing ADR mechanism, not in a new
   decision log.

Risk acceptance belongs to the Product Owner. An accepted risk stays visible in the work log and
relevant canonical documentation.

## 9. Definition of Done

A working UI alone does not complete a package. The dual-agent lifecycle is:

```text
IMPLEMENTED
→ DEVELOPER QA COMPLETE
→ HANDOFF READY
→ CODEX REVIEW
→ CORRECTIONS IF REQUIRED
→ CODEX PASS
→ DOCUMENTATION COMPLETE
→ RELEASE READY
```

These stages supplement, and do not weaken, the package-closure rules in `CLAUDE.md`. In
particular, required review, QA, `QA_LOG.md`, `PROGRESS.md`, backend knowledge, product/release
documentation, external plan synchronization, Git, and other existing closure requirements still
apply. `PASS WITH NON-BLOCKING FINDINGS` may proceed only when remaining findings are visibly
owned and do not violate existing acceptance rules.

## 10. Industrial Engineering Goal

This separation of duties prepares Ceylon Stack for larger engineering teams, human developers,
CI/CD, automated reviews, GitHub pull-request workflows, controlled releases, hosted technical
documentation, mobile and public API development, AI/MCP integrations, and a controlled
domain-by-domain migration away from Frappe where commercially and technically appropriate.

The model is intentionally transferable: Claude's builder role can later be held by a human or a
team, while Codex's evidence and knowledge-control role can evolve into formal architecture, QA,
security, and release gates.
