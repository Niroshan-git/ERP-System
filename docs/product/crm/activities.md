---
title: Activities & Follow-ups
module: CRM
type: document
status: PARTIAL
frontend_route: /crm/activities
canonical_entity: crm-activity
backend_doc: docs/backend/16-crm/crm-architecture.md
last_verified: 2026-09-25
---

## Overview

Activities are how a salesperson records what actually happened on a Lead or Opportunity — a
call, a meeting, a follow-up task, or a freeform note — and tracks what needs to happen next.
There is no separate "Activity" record type: every activity is stored in the real ERPNext
mechanism that already fits it (a phone call is a Communication, a meeting is an Event, a
follow-up is a To Do, a note is the Lead/Opportunity's own Notes list), and this app presents
them together as one combined timeline.

## Business Purpose

Lets a salesperson answer "what's the history on this deal, and what do I need to do next"
without knowing which underlying record type stores each piece of information, and surfaces
overdue/due-today/upcoming follow-ups so nothing gets forgotten.

## Where to Find It

Each Lead/Opportunity's own Activity tab (`/crm/leads/[name]`, `/crm/opportunities/[name]`), plus
a combined cross-record work queue at CRM → Activities (`/crm/activities`).

## Prerequisites

```config
unknown: No hard prerequisite master data — activities can be logged against any existing Lead or Opportunity. Assigning a follow-up to someone other than yourself requires that person to already be a real ERPNext User.
```

## Process Flow

```flow
Lead / Opportunity
Activity History
Call / Meeting / Task / Note
Next Follow-up
Overdue / Due Today / Upcoming
```

## How to Create

1. Open a Lead or Opportunity's detail page and go to its Activity tab.
2. Select **+ Add Activity**.
3. Choose Follow-up, Log Call, Schedule Meeting, or Add Note.
4. Fill in the fields for that activity type and save.
5. To close out a follow-up once it's done, select **Complete** next to it — either on the
   record's own Activity tab or from the CRM → Activities work queue.

## Important Fields

Follow-up **Due Date** is required by this app (even though ERPNext itself would allow a blank
one) — an undated follow-up can't be classified as Overdue/Due Today/Upcoming, which is the whole
point of the feature.

Call **Direction** (Outbound/Inbound) and optional **Outcome** — a short free-text summary of how
the call ended.

## Document Lifecycle

A Follow-up moves Open → Closed (via Complete) and stays visible in the timeline afterward — it
simply stops counting as open/overdue work. Calls, Meetings, and Notes are logged once and remain
as historical record; Meetings additionally carry ERPNext's own native Open/Completed/Closed/
Cancelled status.

## Available Actions

Log Call · Schedule Meeting · Create Follow-up · Add Note · Complete Follow-up · Complete Meeting
(from the Activities work queue only — see Limitations)

## Roles & Permissions

Every activity is attributed to the real signed-in person by name (Call and Follow-up use a
genuine ERPNext identity field for this; Meeting and Note embed the name directly since neither
doctype has a dedicated field for it) — not the shared service account every write in this app
technically runs under. See the "Auth model" note in the frontend README for the underlying
constraint this works around.

## Stock Impact

NO STOCK IMPACT

## Accounting Impact

NO ACCOUNTING IMPACT

## Related Documents

Draws from the same Lead/Opportunity records `lead.md`/CRM Overview describe — an activity always
belongs to exactly one Lead or Opportunity, never both.

## Common Scenarios

A Lead with zero activities shows an empty, intentional "No follow-up scheduled" / "No activity
yet" state rather than looking broken. The CRM → Activities work queue only aggregates Follow-ups
and Meetings (both have a real due/scheduled date to sort by) — logged Calls and Notes stay
visible on their own record's timeline but aren't pulled into the cross-record queue, keeping it a
follow-up execution list rather than a general activity log.

## Limitations

No email/calendar sync — Meetings are logged here, not pushed to or pulled from an external
calendar. No telephony integration — Calls are a manual log entry, not a dialer. Per-user
permission enforcement is not yet live, the same platform-wide limitation `lead.md` already notes.

A Meeting can only be marked complete from the CRM → Activities work queue, not yet from its own
Lead/Opportunity's Activity tab — it's still fully visible there, just without a Complete button on
that page. The "Show only my activities" toggle on the Activities work queue only scopes
Follow-ups; Meetings from every user remain visible regardless, since ERPNext's own Meeting record
has no per-user assignment field to filter by.

## Technical Reference

ERPNext doctypes used: `ToDo` (Follow-up), `Event` (Meeting), `Communication` (Call), `CRM Note`
(Note — the existing child table already on Lead/Opportunity, not a standalone doctype). No new
Ceylon Stack doctype was created. Frontend: `apps/frontend/src/app/(app)/crm/activities/`,
`apps/frontend/src/components/CrmActivityPanel.tsx`. Read/aggregation layer:
`lib/crmActivity.ts`. Full field-level mapping and live-verified behavior:
`docs/backend/16-crm/crm-architecture.md` §8, §26.
