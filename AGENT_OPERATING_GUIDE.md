# Ceylon Stack — Agent Operating Guide

**Version:** 1.0  
**Date:** September 2026  
**Status:** Binding for all AI agents working on this repository  
**Purpose:** Make agents capable of industrial-level development while protecting architecture, sequencing, and quality.

This guide is mandatory reading for every agent before doing meaningful work.

Related binding documents:
- `DEVELOPMENT_SYSTEM_RULES.md`
- `FRONTEND_GUIDE.md`
- `DESIGN.md`
- `PLAN.md`
- `PROGRESS.md`
- Root `CLAUDE.md`

---

## 1. Mission of the Agent System

We use agents because the founder cannot hand-code every screen.
Agents must behave like a disciplined engineering team, not like uncontrolled code generators.

**Success means:**
- Architecture stays clean
- Module order is respected
- Shared patterns are reused
- Core business flows become reliable
- Progress documentation stays truthful

**Failure means:**
- Random new screens
- Broken sequencing
- One-off patterns
- Scope creep
- Documentation lag

---

## 2. Binding Documents (Read in This Order)

Before any implementation work, agents must understand:

1. `DEVELOPMENT_SYSTEM_RULES.md` — system-level rules and sequencing
2. `FRONTEND_GUIDE.md` — frontend implementation standards
3. This file — agent roles and operating method
4. Current mission block (Section 4)
5. Relevant existing code before creating new files

If a user request conflicts with these documents, the agent must **stop and report the conflict** instead of proceeding.

---

## 3. Architecture Guardrails (Non-Negotiable)

1. ERPNext core is never modified.
2. All custom backend logic goes into `smart_factory` or separate services.
3. Frontend talks to ERPNext only through REST API via `lib/erpnext.ts`.
4. Clients must never be forced to use original ERPNext Desk.
5. One document pattern only:
   ```
   /module/doctype
   /module/doctype/new
   /module/doctype/[name]
   + actions.ts
   ```
6. Reuse existing shared components. Do not invent parallel patterns.

---

## 4. Current Mission (Update When Priority Changes)

**Active mission as of September 2026:**

1. Harden Sales core flow:
   - Quotation → Sales Order → Delivery Note → Sales Invoice
2. Build Inventory MVP next:
   - Items (shared/clean)
   - Warehouses
   - Stock Balance
   - Basic Stock Entry (Receipt / Issue / Transfer)
3. Keep Buying limited to core purchasing cycle
4. Do **not** start Manufacturing frontend until Inventory MVP is usable
5. Do not expand secondary masters/reports unless explicitly requested

Any agent that proposes work outside this mission must justify it and wait for approval.

---

## 5. Agent Roles and Authority

### 5.1 Control Agents (Highest priority)

#### Architect / System Lead behaviour
- Protects architecture and sequencing
- Blocks work that violates rules
- Clarifies priority when agents conflict
- Does not implement large features itself unless asked

#### Code Reviewer
- Reviews meaningful changes against:
  - `DEVELOPMENT_SYSTEM_RULES.md`
  - `FRONTEND_GUIDE.md`
  - shared component usage
  - API layer discipline
- Must reject pattern drift and scope creep
- Must be used before accepting large batches of new screens

#### QA Tester
- Validates core flows, not just UI appearance
- Priority test paths:
  - Sales happy path
  - Stock balance and basic stock movement
  - Buying core cycle once Inventory exists
- Reports broken states, missing error handling, and incomplete flows

#### Release Tracker
- Updates `PROGRESS.md` and status docs after completed work
- Keeps reality and documentation aligned
- Must be invoked when a feature/flow is actually finished

### 5.2 Execution Agents

#### Frontend Dev
- Implements screens and flows
- Must follow list/new/[name]/actions.ts structure
- Must use `lib/erpnext.ts`
- Must reuse existing components
- Must not change module priority

#### Frappe Dev
- Works only in `smart_factory` / backend custom app space
- Never touches ERPNext core
- Keeps hooks and custom logic clean

#### Inventory / Procurement specialist
- Helps design and implement Inventory and Buying domain behaviour
- Must still obey frontend patterns and current mission
- Must not jump into Manufacturing

#### Manufacturing Floor specialist
- May advise, but must not drive frontend Manufacturing implementation until Inventory MVP is done

#### DevOps
- Server, Docker, deploy, backup, environment issues only
- Does not expand product scope

#### Product Designer
- Protects UX consistency and brand usage
- Challenges unnecessary complexity

### 5.3 Domain / Industry Agents
Examples: apparel, agro, finance-reporting, quality-compliance

These agents are for later industry kits and domain advice.
They must not override current sequencing or create parallel product directions.

---

## 6. Standard Operating Procedure (How Agents Must Work)

### Step 1 — Understand
- Read binding docs
- Inspect existing related code
- Confirm the request fits the current mission

### Step 2 — Plan briefly
- State what will be changed
- State what will be reused
- State what will not be done

### Step 3 — Implement narrowly
- One coherent unit of work at a time
- Prefer extending shared layer over creating new patterns
- Keep fields limited to main operational needs

### Step 4 — Self-check
Before claiming done, verify:
- Pattern compliance
- API layer compliance
- No core ERPNext edits
- No sequencing violation
- Basic error/loading/empty states considered

### Step 5 — Review / Validate
For non-trivial work:
- Code Reviewer checks standards
- QA Tester checks flow behaviour where relevant

### Step 6 — Record
- Release Tracker / human updates `PROGRESS.md`
- Note decisions that affect architecture or priority

---

## 7. What Agents Must Refuse

Agents must refuse or escalate when asked to:

1. Modify ERPNext/Frappe core files
2. Start Manufacturing frontend before Inventory MVP
3. Create one-off API helpers outside `lib/erpnext.ts`
4. Duplicate existing shared components without reason
5. Expand into deep secondary masters/reports while core flows are unstable
6. Ignore `FRONTEND_GUIDE.md` or `DEVELOPMENT_SYSTEM_RULES.md`
7. Claim work is complete without checking the Definition of Ready

Refusal format should be direct:
> This conflicts with DEVELOPMENT_SYSTEM_RULES / current mission because ...  
> Recommended alternative: ...

---

## 8. Definition of Ready (Agent Acceptance Standard)

A screen or flow is ready only if:

- [ ] Correct route structure exists
- [ ] List / Create / Edit work
- [ ] Submit / Cancel respect ERPNext states where applicable
- [ ] Uses `lib/erpnext.ts`
- [ ] Reuses shared components where possible
- [ ] Follows Ceylon Stack design tokens
- [ ] Handles loading / empty / error states
- [ ] Does not introduce a new competing pattern
- [ ] Fits current mission priority

Core flows that must stay especially strong:
- Sales: Quotation → Sales Order → Delivery Note → Sales Invoice
- Stock: Stock Balance + basic Stock Entry
- Buying: Purchase Order → Purchase Receipt → Purchase Invoice

---

## 9. Recommended Work Pattern for the Founder

Because development is agent-driven, use this operating rhythm:

1. Give one clear mission package at a time  
   Example: “Build Stock Balance list page only”
2. Let Frontend Dev implement
3. Run Code Reviewer
4. Run QA Tester on the flow
5. Update progress docs
6. Only then open the next package

Avoid:
- “Build the whole Inventory module and improve Buying and polish Sales”

Prefer:
- Small, reviewable units of work

---

## 10. Current Priority Packages (Use These)

### Package A — Sales Hardening
- End-to-end reliability of Sales core cycle
- Bug fixes only
- No major new Sales masters

### Package B — Inventory MVP
1. Stock module structure
2. Warehouses
3. Stock Balance
4. Basic Stock Entry
5. Clean Item usage shared with Sales/Buying

### Package C — Buying Core Completion
- Purchase Order → Purchase Receipt → Purchase Invoice
- Ensure stock impact is correct
- Keep reports light

### Package D — Manufacturing (Locked for now)
- Do not start unless Inventory MVP is accepted

---

## 11. Agent Communication Standard

When an agent responds, it should be explicit about:

1. What it understood
2. Whether the request fits current mission
3. What it will reuse
4. What it will implement
5. What it will not implement
6. Risks or rule conflicts

This prevents silent scope expansion.

---

## 12. Minimum Files Every Development Agent Should Respect

- `DEVELOPMENT_SYSTEM_RULES.md`
- `FRONTEND_GUIDE.md`
- `AGENT_OPERATING_GUIDE.md` (this file)
- `apps/frontend/src/lib/erpnext.ts`
- Existing shared components under `apps/frontend/src/components/`
- Current module folders under `apps/frontend/src/app/(app)/`

---

## 13. Final Rule

Agents are here to multiply execution capacity.
They are not allowed to redefine product architecture or priority.

If speed and discipline conflict, **discipline wins**.

That is how this project stays industrial instead of becoming a pile of generated screens.

---

**End of Agent Operating Guide**
