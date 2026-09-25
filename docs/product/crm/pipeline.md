---
title: Pipeline Workspace
module: CRM
type: document
status: PARTIAL
frontend_route: /crm
canonical_entity: crm-pipeline
backend_doc: docs/backend/16-crm/crm-architecture.md
last_verified: 2026-09-25
---

## Overview

The Pipeline Workspace is CRM's landing page (`/crm`) — a sales-management view over every active
Opportunity, answering what's in the pipeline, what it's worth, and what needs attention next. It
introduces no new record type: everything shown is derived at read-time from the same Opportunity,
Lead, and Follow-up/Meeting records `Opportunity`/`Activities & Follow-ups` already own.

## Business Purpose

Lets a salesperson or sales manager open one page and immediately see pipeline health (how many
open deals, what they're worth, weighted by likelihood), which deals are stuck in a stage, and
which specific opportunities need action today — overdue follow-ups, deals with no next step
scheduled, and expected-close dates approaching or already passed.

## Where to Find It

CRM → Workspace (`/crm`) — already the CRM module's own "Home" destination in the sidebar, the
same per-module Home pattern every other module uses.

## Prerequisites

```config
unknown: No hard prerequisite beyond having at least one Opportunity — an empty pipeline renders an intentional "no active opportunities yet" state, not an error.
```

## Process Flow

```flow
Open Opportunities
Pipeline Value / Weighted Pipeline
Stage Board
Attention Queue
Opportunity Detail
```

## Main Functions

KPI summary — Open Opportunities, Pipeline Value, Weighted Pipeline (value × probability), Expected
to Close within 30 days, Overdue Follow-ups, No Next Action. All six reflect whichever filters are
currently applied, not the whole module.

Pipeline Board — every active Opportunity grouped into columns by its Sales Stage (the same fixed
stage order the Opportunity form already uses), with a compact card per deal (value, probability,
expected close, owner, next-follow-up health) and an explicit stage-change control per card.

Attention Queue — six always-visible sections: Overdue Follow-up, Due Today, No Next Action,
Closing Soon (next 7 days), Past Expected Close, and Stale (no recorded activity in 14+ days).

Filters — Stage, Status, Territory, Owner, Origin (Lead- vs. Customer-partied), and Follow-up
Health, plus a "Show only my opportunities" toggle.

## How to Create / Use

1. Open CRM → Workspace, or select "CRM Home" from the sidebar.
2. Use the filter bar to narrow the board to a stage, owner, territory, or follow-up health state —
   the KPI tiles and Attention Queue narrow with it.
3. To move a deal forward, select its new stage from the dropdown at the bottom of its card — this
   updates the real Opportunity immediately; a failed update reverts the card and shows why.
4. Select any card, or any item in the Attention Queue, to open that Opportunity's own detail page
   for the full record and its Activity tab.

## Important Fields

Weighted Pipeline uses each Opportunity's own `opportunity_amount × probability ÷ 100`, the same
formula the Opportunities list's "Weighted Value" column already shows — not a new calculation.

Stale is a Ceylon Stack product default (14 days since the last logged Call, Meeting, or Follow-up),
not an ERPNext-derived value — there is no live usage pattern yet to tune it against.

## Document Lifecycle

The workspace has no lifecycle of its own — it reflects each Opportunity's existing status/stage in
real time. An Opportunity that reaches Lost, Converted, or Closed drops out of the active pipeline
view entirely (it remains fully visible on the Opportunities list).

## Available Actions

Change Stage (per card) · Filter · Show only my opportunities · open any Opportunity's detail page

## Roles & Permissions

"My Opportunities" scopes by the Opportunity's own Owner field, matched against the signed-in
person's email — the same distinct-from-assignment ownership concept `lead.md`/`opportunity.md`
already establish. Per-user permission enforcement is not yet live, the same platform-wide
limitation those documents already note.

## Stock Impact

NO STOCK IMPACT

## Accounting Impact

NO ACCOUNTING IMPACT

## Related Documents

`opportunity.md` for the Opportunity record itself and its own stage/status fields. `activities.md`
for how the Overdue/Due Today/No Next Action follow-up signals are derived — the workspace reuses
that exact logic rather than recalculating it separately.

## Common Scenarios

A brand-new tenant with zero Opportunities sees a positive, intentional empty state on both the
board and every Attention Queue section, not a broken-looking blank page. Filtering down to a
single owner or stage narrows the KPI tiles and Attention Queue along with the board, so "my
overdue follow-ups" always reflects exactly what's currently on screen.

## Limitations

Win rate, won/lost revenue, and conversion rate are not shown — ERPNext's Opportunity won/lost
transition has not yet been verified end-to-end against a live instance (tracked as `CRM-UNV-010`/
`CRM-UNV-011`), and this page does not present unverified figures as fact. KPI value totals are shown
in a single currency only when every active Opportunity shares one; a mixed-currency pipeline omits
the currency label rather than adding amounts across currencies. Stage movement is a dropdown, not
drag-and-drop.

## Technical Reference

Aggregation service: `apps/frontend/src/lib/crmPipeline.ts` (server-only, bulk-fetches Opportunities
plus every open Follow-up and every Meeting/Call creation timestamp in four total requests,
regardless of pipeline size). Board: `apps/frontend/src/components/PipelineBoard.tsx`. Stage
mutation: `updateOpportunityStageAction` in `apps/frontend/src/app/(app)/crm/opportunities/
actions.ts`. Full derivation detail and live-verification status: `docs/backend/16-crm/
crm-architecture.md` §12, §27.
