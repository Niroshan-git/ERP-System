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
- [ ] Enable Manufacturing module, create sample master data (Items, BOM, Workstations, Work Order → Job Cards, Quality Inspection template)
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
