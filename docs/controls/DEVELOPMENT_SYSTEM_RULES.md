# Ceylon Stack — Development System Rules

**Version:** 1.0  
**Date:** September 2026  
**Status:** Binding for all frontend and product development  
**Audience:** Founders, Claude agents, future developers

This document defines how we build Ceylon Stack.  
It sits above day-to-day coding decisions and must be followed.

This file lives in `docs/controls/` alongside the other binding documents.
See `CLAUDE.md` at the repo root for the master entry point.

Related documents:
- `docs/controls/FRONTEND_GUIDE.md` — detailed frontend implementation rules
- `PLAN.md` (repo root) — overall project plan
- `PROGRESS.md` (repo root) — what has actually been done
- `DESIGN.md` (repo root) — brand and visual system

---

## 1. Core Philosophy

1. We are building a **product**, not a clone of ERPNext Desk.
2. ERPNext is the reliable backend engine. We never modify its core.
3. The custom frontend is the only interface clients will use.
4. Speed is valuable only when it does not destroy quality or sequencing.
5. AI is a fast junior developer. Humans (or clear review rules) remain the architect.

---

## 2. Architecture Rules (Non-Negotiable)

1. **Headless only**
   - ERPNext core remains untouched.
   - All custom logic lives in `smart_factory`, `frontend`, `mes-service`, or `mcp-server`.
   - Communication with ERPNext happens only through the official REST API.

2. **Single source of truth**
   - Business logic, validation, stock ledger, accounting entries, and permissions stay in ERPNext.
   - The frontend must not re-implement core ERP rules.

3. **One consistent document pattern**
   ```
   /module/doctype          → List
   /module/doctype/new      → Create
   /module/doctype/[name]   → View / Edit
   ```

4. **Shared layer is mandatory**
   - All API calls go through `lib/erpnext.ts`.
   - Reusable UI lives in `components/`.
   - No copy-paste of fetch/save logic into individual pages.

---

## 3. Module Sequencing Rules

We follow a strict order. Do not jump ahead.

### Current Official Order

| Priority | Module              | Status Intent                          |
|----------|---------------------|----------------------------------------|
| 1        | Sales               | Harden core flow, then freeze          |
| 2        | Inventory / Stock   | Build proper foundation next           |
| 3        | Buying              | Complete core cycle after Inventory    |
| 4        | Manufacturing       | Only after Inventory is usable         |
| 5        | Light Accounting + Dashboards | After operational flows are stable |

### Sequencing Rules

1. **Harden before expand**  
   A module’s core happy path must be reliable before we add secondary screens or move to the next module.

2. **Inventory before Manufacturing**  
   Manufacturing depends on Items, Warehouses, Stock Balance, and basic Stock Entries. Skipping Inventory creates rework.

3. **One major active focus at a time**  
   Avoid opening multiple heavy modules in parallel unless there is a clear and temporary reason.

4. **Freeze completed cores**  
   Once a core flow is declared stable, only bug fixes and critical polish are allowed unless explicitly re-opened.

---

## 4. Development Process Rules

### 4.1 Before writing code
- Read `FRONTEND_GUIDE.md` and this document.
- Confirm the work fits the current module priority.
- Prefer extending existing shared components over creating new one-off patterns.

### 4.2 While coding
- Follow the standard list / new / [name] / actions.ts structure.
- Use design tokens from `DESIGN.md` only.
- Keep forms focused on main fields that daily users need.
- Handle loading, empty, error, and permission states cleanly.

### 4.3 After meaningful work
- Update `PROGRESS.md` with what actually changed.
- Note any decisions that affect sequencing or architecture.
- Do not leave the repository status section outdated.

### 4.4 AI-assisted development rules
- AI may generate screens and components quickly.
- AI must still obey folder structure, API layer, and sequencing rules.
- Any generated code that breaks shared patterns must be corrected before it is considered done.
- The human owner (or designated reviewer) remains responsible for architectural decisions.

---

## 5. Quality Gates (Definition of Ready)

A document or flow is considered ready only when:

- [ ] List page works with basic filters and pagination
- [ ] Create and Edit work correctly
- [ ] Submit and Cancel respect ERPNext document states
- [ ] Line items (where relevant) work reliably
- [ ] Uses `lib/erpnext.ts` and shared components
- [ ] Follows Ceylon Stack visual design
- [ ] Works acceptably on mobile widths
- [ ] Error and empty states are handled
- [ ] No obvious broken navigation or dead ends

Core flows that must stay especially strong:
- Sales: Quotation → Sales Order → Delivery Note → Sales Invoice
- Buying: Purchase Order → Purchase Receipt → Purchase Invoice
- Stock: Stock Balance + basic Stock Entry movements

---

## 6. Scope Control Rules

1. **Main features only** in early versions.
2. Do not rebuild every ERPNext screen or report.
3. Secondary masters and advanced tools come after core flows are stable.
4. When in doubt, choose fewer solid screens over many incomplete ones.
5. New ideas go into a backlog. They do not automatically enter the current sprint of work.

---

## 7. Branch & Documentation Rules

1. `frontend` is currently the active product branch.
2. Significant progress must not remain invisible in `PROGRESS.md` or the root README status.
3. Avoid long-term divergence between documentation and reality.
4. Architectural decisions should be recorded briefly when they change sequencing or patterns.

---

## 8. Risk Control Rules

Watch for these failure modes and stop them early:

| Risk | Response |
|------|----------|
| Scope creep | Return to the official module order |
| Pattern drift | Refactor to shared components / `lib/erpnext.ts` |
| Foundation skipped | Do not start Manufacturing until Inventory MVP exists |
| Documentation lag | Update `PROGRESS.md` before starting the next major piece |
| Over-reliance on raw AI output | Review against this document and `FRONTEND_GUIDE.md` |

---

## 9. Decision Authority

- **Architecture & sequencing decisions** → Founder / product owner
- **Day-to-day implementation** → May be AI-assisted, but must obey these rules
- **Exceptions** → Must be explicitly noted (short note in `PROGRESS.md` is enough)

If a proposed change conflicts with these rules, the rules win unless deliberately updated.

---

## 10. Current Working Priorities (as of Sep 2026)

1. Harden Sales core flow and freeze major new Sales features
2. Build Inventory MVP (Items, Warehouses, Stock Balance, basic Stock Entry)
3. Complete Buying core cycle against real stock behaviour
4. Only then begin Manufacturing

---

**End of Rules**

These rules exist to protect speed *and* quality.  
Follow them so Ceylon Stack remains a coherent product instead of a collection of screens.
