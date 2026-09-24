# CRM — Domain Overview

**Status:** `DOCUMENTED` (discovery/architecture only, package `CRM-0`, 2026-09-24). **No frontend
exists.** No route, Sidebar entry, form, or server action has been built for this domain.

**Folder numbering note:** this domain was not among the `01-08` slots `docs/controls/
BACKEND_KNOWLEDGE_POLICY.md` §4 originally enumerated (written 2026-09-17, before CRM was scheduled).
Rather than renumber existing folders — which would break cross-references throughout already-committed
docs — this domain is `16-crm/`, appended after `15-migration/`. It is not a reuse of the
reserved-but-still-unpopulated `07-tax/`/`08-workflows/` slots.

## Files in this folder

| File | Covers | Status |
|---|---|---|
| [`crm-architecture.md`](crm-architecture.md) | Lead, Opportunity, Prospect — full canonical model, conversion mechanism, activity architecture, CRM/Sales/Master Data/Finance boundaries, pipeline design, `CRM-1`–`CRM-5` package roadmap | `CLAUDE_HANDOFF` — discovery complete, not self-declared `ACCEPTED`, needs Niroshan's sign-off before `CRM-1` starts |

## Method

Live schema (`mcp__ceylon-stack__list_doctypes`/`get_doctype_fields`/`list_documents` against the real
Hetzner instance) plus GitHub source reads (`frappe/erpnext` `develop` branch, evidence provenance
disclosed throughout as `SOURCE VERIFIED (GitHub develop)`, not silently upgraded to `VERIFIED`). **No
live Lead/Opportunity/Prospect records exist on this instance** — every finding is schema- and
source-verified, not runtime-behavior-verified. See `crm-architecture.md` §21 for the precise scope of
that gap.

## What's next

`CRM-1 — Leads` is the next package in sequence, per `crm-architecture.md` §18 — **not authorized to
start by this document alone.** See that document's Governance section.
