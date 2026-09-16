# Ceylon Stack — Agent Usage Policy

**Version:** 1.0  
**Date:** September 2026  
**Status:** Binding  
**Purpose:** Control cost, protect architecture, and force industrial-quality agent usage.

This policy exists because unrestricted agent usage creates:
- High token cost
- Oversized sessions
- Weak review/QA ratio
- Scope creep
- Architectural drift

This file lives in `docs/controls/` alongside the other binding documents.
See `CLAUDE.md` at the repo root for the master entry point.

Related documents:
- `docs/controls/AGENT_OPERATING_GUIDE.md`
- `docs/controls/DEVELOPMENT_SYSTEM_RULES.md`
- `docs/controls/FRONTEND_GUIDE.md`

---

## 1. Policy Goal

Use agents to multiply execution capacity **without** losing control.

Every agent session must optimise for:
1. Correct architecture
2. Correct sequencing
3. Small, reviewable units of work
4. Reasonable cost
5. Honest progress tracking

---

## 2. Observed Failure Pattern (Why This Policy Exists)

Recent usage showed:
- 100% of usage from subagent-heavy sessions
- 55% of usage from sessions with >150k context
- ~47% of usage dominated by `frontend-dev`
- Very low relative usage of `code-reviewer` and `qa-tester`

This means the system was generation-heavy, not control-heavy.

That pattern is not allowed as the default operating mode.

---

## 3. Default Operating Mode

### Default = single agent + small package

Unless there is a clear reason otherwise:

- Start with **one** agent
- Give **one** narrow task
- Complete it
- Review it
- Only then open the next task

### Forbidden default behaviour
- Spawning many subagents at the start of every session
- “Build the whole module” requests
- Keeping one long chat alive across multiple unrelated tasks
- Generating large batches of screens without review

---

## 4. Session Rules

### 4.1 One mission per session
Each session should have one clear mission package.

Good:
- Build Stock Balance list page
- Fix Sales Order submit flow
- Add Warehouse form

Bad:
- Improve Sales, start Inventory, and clean Buying in one session

### 4.2 Keep context under control
Long context is expensive and reduces quality.

Rules:
- Prefer fresh sessions when switching modules or major tasks
- Use compaction when a session becomes heavy
- Do not carry unrelated history into new work
- Do not keep expanding one session just because it is convenient

### 4.3 Stop conditions
End or reset a session when:
- The assigned package is complete
- Context has become large and noisy
- The work is shifting to a different module
- Review/QA needs a clean pass

---

## 5. Subagent Spawning Policy

Subagents are allowed, but they are not free.

### Allowed reasons to spawn a subagent
- Code review after meaningful implementation
- QA validation of a core flow
- Release/progress update after a completed package
- Narrow specialist help for a clearly scoped problem

### Not allowed by default
- Spawning multiple agents “just in case”
- Parallel agents doing broad exploratory work on the same package
- Using subagents to bypass sequencing or architecture rules

### Cost-aware rule
If one agent type (especially `frontend-dev`) begins to dominate usage, tighten:
- task size
- prompt strictness
- review frequency

---

## 6. Required Control Loop

For non-trivial development work, use this loop:

1. **Implement** with the minimum necessary agent  
2. **Review** with `code-reviewer`  
3. **Validate** with `qa-tester` when the work affects a core flow  
4. **Record** with `release-tracker` / progress update when the package is complete  

Skipping review for large generation batches is a policy violation.

---

## 7. Agent Budget Intent

This is not a hard numeric quota. It is a behavioural target.

| Activity | Intent |
|----------|--------|
| Implementation (`frontend-dev`, etc.) | Majority of useful build work, but in small packages |
| Review (`code-reviewer`) | Meaningful share of usage, not rare |
| QA (`qa-tester`) | Used on core flows before package acceptance |
| Release tracking | Used at completion, not continuously |
| Explore / Plan | Occasional only |
| Broad multi-agent sessions | Exception, not default |

If usage returns to “almost all generation, almost no review,” the process is failing.

---

## 8. Task Packaging Standard

All agent work should be assigned as a **package**.

### Valid package examples
- Create `/stock/warehouses` list + form using existing patterns
- Implement Stock Balance page with filters for Item and Warehouse
- Fix Delivery Note → stock impact issues
- Harden Sales Invoice submit/cancel behaviour

### Invalid package examples
- Build Inventory module fully
- Improve the whole frontend
- Start Manufacturing while finishing Inventory and polishing Sales

### Package completion rule
A package is complete only when it meets the Definition of Ready in `docs/controls/AGENT_OPERATING_GUIDE.md` and relevant guide documents.

---

## 9. Model and Cost Discipline

Where the platform allows model choice:

1. Use stronger models for architecture, review, and difficult debugging
2. Use cheaper models for repetitive narrow UI generation when quality remains acceptable
3. Never use an expensive long-context session for a small isolated task

Especially for `frontend-dev`:
- Keep prompts strict
- Limit scope to the requested unit
- Forbid voluntary expansion into nearby screens

---

## 10. Architecture Protection During Agent Use

No matter which agent is used, these remain non-negotiable:

1. Do not modify ERPNext core
2. Do not break headless architecture
3. Do not bypass `lib/erpnext.ts`
4. Do not invent parallel document patterns
5. Do not start Manufacturing frontend before Inventory MVP is accepted
6. Do not expand outside the current mission without explicit approval

If an agent request conflicts with these rules, the agent must refuse and report the conflict.

---

## 11. Founder Operating Checklist

Before starting an agent session, confirm:

- [ ] The task is one package, not a whole module
- [ ] The task fits current mission priority
- [ ] I know whether review/QA will be required after
- [ ] I am not continuing an oversized old session without reason
- [ ] I am not spawning extra subagents by default

After the session:

- [ ] Was only the requested scope changed?
- [ ] Does the result need code review?
- [ ] Does a core flow need QA?
- [ ] Does progress documentation need updating?
- [ ] Should the next task start in a clean session?

---

## 12. Enforcement Standard

This policy is violated when:

- Sessions regularly exceed very large context for small work
- `frontend-dev` generates large batches without review
- Multiple subagents are spawned as a habit
- Agents expand scope beyond the assigned package
- Core sequencing is ignored
- Progress is claimed without Definition of Ready checks

When violations repeat, stop generation and return to:
1. smaller packages
2. stronger review
3. cleaner sessions

---

## 13. Preferred Weekly Rhythm

A healthy agent-driven week looks like:

1. A few narrow implementation packages
2. Review after each meaningful package
3. QA on completed core flows
4. Progress documentation updates
5. Fresh sessions for major task switches
6. No uncontrolled multi-agent sprawl

That rhythm is slower in appearance than free generation, but much faster in real product progress.

---

## 14. Final Rule

Agents are a force multiplier only when controlled.

**Default stance:**
- Fewer agents
- Smaller tasks
- Shorter context
- Mandatory review
- Strict sequencing

If cost and chaos rise again, reduce agent freedom first — not architecture quality.

---

**End of Agent Usage Policy**
