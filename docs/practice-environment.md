# Practice / Dev Environment — Lightweight App Track

Purpose: a safe, isolated place to build and test the lightweight bundles
(`ceylon_services` + optional `hrms`/`crm`/`helpdesk`/`insights`) without
touching any real client data or the manufacturing/`smart_factory` track.
This is also written to double as the onboarding runbook for a new client
site later — the steps are the same, just with a different site name and
app selection.

## Why a second site, not a second server

Frappe/Bench supports multiple isolated sites on one bench — each site is
its own database, but they share the same installed apps and the same
server. This means:

- No new server, no new Hetzner instance, no extra hosting cost.
- Full isolation: nothing in `practice.ceylonstack.local` can corrupt or
  leak into any real client's site database.
- The apps you install here (`ceylon_services`, `hrms`, `crm`, etc.) are
  the exact same code that would run for a real client — so whatever gets
  proven out here is directly reusable, not a throwaway prototype.

## Setup steps

Run these on the Hetzner server, inside the bench directory:

```bash
# 1. Create the new site (separate DB, same bench/apps)
bench new-site practice.ceylonstack.local --install-app erpnext

# 2. Install the lightweight-tier app
bench --site practice.ceylonstack.local install-app ceylon_services

# 3. Install optional bundles as needed, one at a time, testing after each
bench --site practice.ceylonstack.local install-app hrms
# bench --site practice.ceylonstack.local install-app crm
# bench --site practice.ceylonstack.local install-app helpdesk
# bench --site practice.ceylonstack.local install-app insights
```

Add `practice.ceylonstack.local` to the bench's site config / hosts entry
as usual so it resolves like any other multi-tenant site.

## What to test here

- `ceylon_services`' per-app allow-list mechanism — confirm the
  Manufacturing workspace is hidden and only the relevant modules show for
  a non-manufacturing profile (gym/salon/hardware store/supermarket).
- Each optional bundle (`hrms`, `crm`, `helpdesk`, `insights`) installed
  cleanly alongside `ceylon_services` with no conflicts.
- Desk theming/branding applies correctly on a fresh site (not just on the
  original dev site where it was built).
- Whatever a separate developer builds for the lightweight-tier UI/UX —
  this is their sandbox, isolated from the ERPNext/manufacturing track you
  are personally focused on.

## Licensing note for this environment

Per the corrected licensing note in `PLAN.md`: `hrms` is GPL-3.0 (no
obligation from hosting it as SaaS). `crm`, `helpdesk`, and `insights` are
AGPL-3.0 — before any of these three go live for a **real client** (not
needed for internal practice/testing), add a visible "Source Code" link in
that site's UI pointing to the exact unmodified upstream repo
(`github.com/frappe/crm`, `/helpdesk`, `/insights`). Not required on this
practice site since it's internal-only, but bake it into whatever the
lightweight-tier developer ships for a client.

## Handoff note for a separate developer

If someone else is building the lightweight app while you focus on
ERPNext/manufacturing, this doc plus `PLAN.md`'s "Product Portfolio"
section and the licensing note are the two things they need before
touching `ceylon_services`. They should develop against
`practice.ceylonstack.local`, never against a real client site or the
`smart_factory`/manufacturing sites.
