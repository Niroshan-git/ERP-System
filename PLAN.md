# PLAN.md — Smart Factory on ERPNext: Weekly Implementation Plan

This mirrors the Notion page "Smart Factory on ERPNext – Weekly Implementation Plan" — keep both in sync when either changes.

**Goal:** Build a working Smart Factory prototype using ERPNext (Manufacturing module) as the ERP backbone + a custom real-time MES/IoT layer, mobile-friendly, starting on the cheapest viable infrastructure.

## Architecture Summary

| Layer | Technology | Cost |
|---|---|---|
| ERPNext + MariaDB + Redis | Hetzner CX23 VPS (Helsinki) + Docker (`frappe_docker`) | ~€4.50–7/mo |
| Custom MES / IoT service | Python (FastAPI), same VM or a free-tier host | Free |
| Sensor / event DB | Postgres + TimescaleDB (Supabase or Neon) | Free tier (500MB–1GB) |
| MQTT broker | HiveMQ Cloud free tier or self-hosted Mosquitto | Free |
| Frontend / Dashboards | Vercel (Next.js) | Free tier |
| Mobile | Responsive ERPNext Desk + PWA on Vercel | Included |

## Key Rules

- Never modify ERPNext core code. Use custom Frappe apps + API only.
- Start with simulated machine data; real sensors later.
- Keep the custom MES service thin: ingest → calculate OEE → push to ERPNext + store events.
- Don't put real secrets in this repo — see the Credentials section in `CLAUDE.md`.

---

## Week 1–2: Foundation — Stand Up ERPNext ✅ Mostly done

**Goal:** Working ERPNext Manufacturing module with test data, accessible from phone.

- [x] Provision a VPS (Hetzner CX23, after Oracle's free tier proved unreliable)
- [x] Install Docker + Docker Compose
- [x] Clone `frappe/frappe_docker`
- [x] Deploy ERPNext via `pwd.yml` quick-start
- [x] Create site, install ERPNext app, log into Desk UI
- [x] Complete initial company setup wizard
- [ ] Secure basic access (firewall rules, change default Administrator password)
- [x] Enable Manufacturing module, create sample master data (Items, BOM, Workstations, Work Order → Job Cards, Quality Inspection template)
- [ ] Walk through a complete Manufacturing flow end-to-end
- [ ] Verify Desk UI works reasonably on mobile browser

**Deliverable:** Stable ERPNext instance reachable from phone.

---

## Week 3–4: Learn & Extend Inside ERPNext

**Goal:** Comfortable customizing without touching core code.

- [ ] Set up VS Code Remote-SSH + Dev Containers workflow (connect to server → attach to `frappe_docker-backend-1`)
- [ ] Create custom Frappe app: `bench new-app smart_factory`
- [ ] Push the app to GitHub: https://github.com/Niroshan-git/ERP-System.git
- [ ] Install the custom app on the site
- [ ] Add custom fields / DocTypes (e.g. Machine, Sensor Reading link, OEE fields on Job Card)
- [ ] Write simple Server Scripts to auto-update Job Card status and log downtime reasons
- [ ] Confirm REST API endpoints work for the new DocTypes (Frappe exposes these automatically)
- [ ] Test customizations on mobile Desk UI
- [ ] Document the custom app structure

**Deliverable:** Custom app installed, basic manufacturing process customized, code safely in GitHub.

---

## Week 5–6: Real-Time Integration Layer (the "Smart" core)

**Goal:** Live data flowing into ERPNext.

- [ ] Set up MQTT broker (HiveMQ Cloud free tier, or Mosquitto container on the server)
- [ ] Build a Python simulator publishing fake machine data (temperature, speed, status) every few seconds
- [ ] Build a FastAPI MES service that: subscribes to MQTT, calculates OEE (Availability × Performance × Quality), writes events to Postgres/TimescaleDB, calls ERPNext's API to update Job Card/Work Order status and log downtime
- [ ] Design the Postgres schema for sensor readings + OEE events
- [ ] Test end-to-end: simulated machine "goes down" → Job Card updates in ERPNext + OEE recorded

**Deliverable:** Automatic status updates and OEE logging from simulated data.

---

## Week 7–8: Mobile-Friendly Frontend + Dashboards

**Goal:** A UI that works well on a phone.

- [ ] Create a Next.js project, deploy to Vercel
- [ ] Mobile-first UI: live machine status cards, OEE gauges, active Work Orders/Job Cards list, downtime log
- [ ] Authenticate against ERPNext (API key/token)
- [ ] Pull data from Postgres and the ERPNext API
- [ ] Add a PWA manifest (installable on a phone home screen)
- [ ] Optional: simple Three.js digital-twin view of the factory floor

**Deliverable:** Responsive web app a supervisor can open on their phone to see live factory status.

---

## Week 9–10: Polish, Analytics & Hardening

**Goal:** Production-ready prototype.

- [ ] Error handling, retries, and logging in the MES service
- [ ] Dashboards: OEE trends, downtime Pareto, production vs. plan
- [ ] Security pass: API key rotation, HTTPS everywhere, basic rate limiting
- [ ] Backup strategy (MariaDB dumps + Postgres snapshots)
- [ ] Documentation: how to restart services, data flow diagram
- [ ] Light load-test with more simulated machines

**Deliverable:** Usable prototype ready for a client demo.

---

## Week 11–12+ (Stretch)

- [ ] Connect a real PLC/sensor (OPC-UA or Modbus → MQTT gateway)
- [ ] Simple predictive maintenance / anomaly detection
- [ ] Multi-user roles and permissions
- [ ] Offline-capable PWA features
- [ ] Move the MES service to a more robust host if needed

---

## Multi-Client / Commercial Notes

- **Multi-tenancy:** Frappe supports multiple isolated "sites" (each with its own database) on one shared bench — this is the path to serving multiple clients without provisioning a new server per client. Use separate UAT and Live sites per client (e.g. `clientname-uat.domain.com` and `clientname.domain.com`).
- **Free-tier hosting is for prototyping only.** Once a real paying client is involved, move to paid hosting with backups and support — a client's production data shouldn't sit on infrastructure with no backup guarantee.
- **Pricing shape:** one-time setup/customization fee (covers deployment + the `smart_factory` app work) + a modest monthly hosting/support retainer per client (recurring revenue).

---

## Product Portfolio (added 2026-09-13)

Ceylon Stack isn't only a manufacturing ERP — it's a whitelabel product
line built on Frappe's whole app ecosystem, not just ERPNext. Full
architecture/reasoning: `project_product_portfolio_plan` memory. Every
product below installs unmodified alongside ERPNext on a client's site
(same bench, same database) and is curated through `ceylon_services`'
per-app allow-list mechanism — no new integration layer per product.

| Bundle | Apps installed | Verticals | Status |
|---|---|---|---|
| Core lightweight | ERPNext + `ceylon_services` | gym, salon, hardware store, supermarket | Shipped |
| + HR add-on | above + `hrms` (Frappe HR) | any of the above with staff to schedule/pay; also offered to `smart_factory` manufacturing sites | Shipped 2026-09-13 — payroll → GL posting verified live |
| + CRM add-on | above + `crm` | sales-pipeline-heavy (wholesale, member acquisition) | Future — overlaps native ERPNext CRM workspace, needs a per-client fit call |
| + Helpdesk add-on | above + `helpdesk` | support-ticket-heavy (multi-branch retail, e-commerce) | Future |
| + Insights add-on | above + `insights` | any tier wanting BI dashboards without custom `apps/frontend` work | Future |

**Explicitly not pursuing:** Lending (microfinance-specific, no client
demand) and Learning/LMS (defer until a training-heavy client appears).

**License note — CORRECTED 2026-09-13, previous version of this note was wrong:**
HRMS and Lending are GPL-3.0 (verified). CRM, Helpdesk, and Insights are
AGPL-3.0 (verified against github.com/frappe/crm, /helpdesk, /insights
directly — LMS not yet independently checked, treat as AGPL-3.0 until
confirmed otherwise).

The previous claim that "neither creates an obligation" for the AGPL apps
was incorrect. AGPL's entire point versus GPL is that it does NOT require
modification to trigger an obligation: AGPLv3 §13 requires that anyone
interacting with the software **over a network** — i.e. any hosted/SaaS
use, modified or not — be prominently offered the corresponding source.
GPL-3.0 (ERPNext, HRMS) has no such clause; hosting it as SaaS with no
distribution triggers nothing. AGPL-3.0 (CRM, Helpdesk, Insights) does.

Practical fix, cheap since these apps are unmodified: before any `crm`,
`helpdesk`, or `insights` bundle goes live for a real client, add a
visible "Source Code" link/notice in that site's UI (footer or About
page) pointing to the exact unmodified upstream repo
(github.com/frappe/crm etc.) — since it's unmodified, the corresponding
source already exists publicly; the obligation is to *offer* it
prominently, not to publish anything new. Skipping this step is the
actual non-compliance risk, not the mere act of hosting the app. If
`ceylon_services` or any custom Frappe app ever patches/forks
CRM/Helpdesk/Insights code directly (not just installs it unmodified),
that modified version must be published to users under AGPL — that's the
one thing that would actually be expensive to fix after the fact, so it's
worth deciding now: unmodified installs only for these three, all
Ceylon-specific customization stays in `ceylon_services` (a separate,
proprietary app) exactly as already planned.
