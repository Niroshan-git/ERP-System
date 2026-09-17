# frontend

Next.js app (App Router, TypeScript, Tailwind v4) that replaces ERPNext's own
Desk UI for end users. Talks to ERPNext purely through its REST API — no
Desk, no core edits — per the headless architecture in the root `CLAUDE.md`.

## Design system

The app UI follows `docs/brand/package/ceylon-stack-frontend-design.md`
(industrial-functional: graphite neutrals, one teal `signal` accent, IBM
Plex Sans for all UI text, IBM Plex Mono reserved for machine-readable data —
IDs, quantities, timestamps). This supersedes `/DESIGN.md`'s
Fraunces/Archivo/sapphire-cinnamon system for this app specifically —
`/DESIGN.md` still governs brand identity, logo, voice, and marketing
material. Tokens live in `src/app/globals.css`; fonts load via
`next/font/google` in `src/app/layout.tsx`. If the frontend design doc ever
changes, update `globals.css` to match.

## Auth model (read this before changing anything auth-related)

**Service-account proxy**, chosen deliberately over full per-user ERPNext
sessions to ship fast:

- A user logs in with their own ERPNext email/password on `/login`. That
  credential is checked once against Frappe's own `/api/method/login` — this
  authenticates the *person*, nothing more.
- On success, the app issues its **own** signed, httpOnly session cookie
  (`lib/session.ts`, HMAC-SHA256 via Web Crypto, `SESSION_SECRET` in
  `.env.local`) — independent of ERPNext's session/sid.
- All ERPNext data calls (`lib/erpnext.ts`) run server-side as one dedicated
  ERPNext user — `frontend-integration@ceylonstack.local` — using an API
  key/secret (`ERPNEXT_API_KEY` / `ERPNEXT_API_SECRET` in `.env.local`,
  never sent to the browser). That user's roles started scoped to exactly
  what each phase needed (`Sales User` + `Item Manager` for Customer/Item/
  Quotation/Sales Order) and grew as real gaps were hit — `Accounts User`
  was added once Sales Invoice screens went live and 403'd (an accounting
  doctype, not covered by the Selling-module roles). Current roles:
  `Sales User`, `Item Manager`, `Accounts User`. If a future doctype 403s,
  `components/AccessDeniedNotice.tsx` is what renders instead of a crash —
  the fix is always the same: an ERPNext admin grants the missing role via
  Desk → User → Role Profile, a live-server change, not a code change.
- **Known limitation:** ERPNext's own per-user role/permission rules are
  **not** enforced yet — every logged-in person effectively has the
  integration account's access, gated only by what this app's UI exposes.
  Fine for an internal MVP; revisit before it matters who can see/edit what
  (e.g. one sales rep's customers hidden from another). Upgrading to full
  per-user sessions means handling Frappe's session+CSRF-token handshake
  server-side — a deliberately deferred, more-plumbing option.
- `src/middleware.ts` gates every route except `/login` and `/api/*` behind
  a valid session cookie.

## What's built

- Login (`/login`) — the logo-reveal animation, email/password against
  ERPNext.
- App shell (`src/app/(app)/layout.tsx`) — sidebar grouped Sales / Items &
  Pricing / Setup (mirroring ERPNext's own Selling workspace); Manufacturing
  is a real, clickable module (unlocked 2026-09-17 — see "Manufacturing
  module" below), not the greyed "coming soon" placeholder it started as.
  Topbar (user name, logout). The notification bell
  is a visual placeholder only — real Notification Log data needs per-user
  ERPNext identity (see the auth limitation above), so it's left inert
  rather than shipped showing the wrong person's notifications.
- **Customer, Item** (Phase 1): list + create + edit.
- **9 Selling-module masters** (Phase 2): Customer Group, Territory, Item
  Group, Price List, Sales Person, Sales Partner, Contact, Address,
  Campaign — same list/create/edit shape, built on shared
  `components/MasterTable.tsx` + `MasterForm.tsx` + `lib/masterActions.ts`
  instead of copy-pasting Customer/Item nine times.
- **Quotation, Sales Order, Sales Invoice** (Phase 3): full child-table
  line-item editing (`components/LineItemsEditor.tsx`) and the
  Draft→Submitted→Cancelled workflow (`lib/docStatus.ts`,
  `components/DocActionBar.tsx`). `lib/salesDefaults.ts` resolves
  company/currency/price-list/accounting defaults the way Desk does
  client-side — deliberately simplified for this single-currency (LKR)
  business (conversion_rate always 1, no exchange-rate lookups); a resolved
  fallback warehouse is applied to every Sales Order line too, since not
  every item has a per-company default warehouse configured in ERPNext —
  see `getSellingDefaults`. Line items now resolve through ERPNext's real
  `apply_pricing_rule` engine, and document-level discounts
  (`apply_discount_on`/`additional_discount_percentage`/`discount_amount`)
  are live on all three doctypes.
- **Sales scope beyond the original happy path** (shipped 2026-09-14/15):
  Pick & Pack (Sales Order → Pick List → Delivery Note, with
  `picked_qty`/`delivered_qty` write-back), partial fulfillment (multiple
  partial Sales Orders from one Quotation, multiple partial Invoices from
  one Sales Order), "Copy From Quotation" (SAP B1-style multi-Quotation →
  one Sales Order), Quotation lifecycle ("Set as Lost", Amend-after-cancel),
  and a Reports hub covering the majority of ERPNext's native
  Selling-module reports. Full detail in `docs/controls/FRONTEND_GUIDE.md` §9.
- **Buying module** (shipped, live-verified 2026-09-16): full core
  purchasing cycle — Material Request → Request for Quotation → Supplier
  Quotation → Purchase Order → Purchase Receipt → Purchase Invoice — plus
  Suppliers, mirroring the Sales module's list/`[name]`/`actions.ts`
  pattern, behind its own Sidebar nav group. Live end-to-end QA pass
  confirmed correct `Bin` stock impact and error-case handling; no code
  fixes required. Buying Reports hub live (13 of ERPNext's native
  Buying-workspace reports). See `docs/controls/FRONTEND_GUIDE.md` §10.
- **Inventory / Stock module** (shipped, reviewed + QA'd 2026-09-16):
  Warehouses, Batches, Serial Nos (shared `MasterTable`/`MasterForm`
  masters), Stock Entry (Material Issue/Receipt/Transfer with a real
  Draft→Submitted→Cancelled workflow and batch/serial line tracking via the
  same `BatchSerialPicker` built for Delivery Note), Stock Balance (a live
  view backed by the `Bin` doctype), and a Stock Reports hub entry — full
  Inventory MVP v1 scope. QA caught and fixed one real bug (`s_warehouse`
  not sent on batch/serial-tracked outbound Stock Entries — see `QA_LOG.md`).
  See `docs/controls/FRONTEND_GUIDE.md` §10a.
- **Tab layout + Connections** (mirrors ERPNext's own Desk form):
  `components/DocTabs.tsx` gives Quotation/Sales Order/Sales Invoice
  detail pages the same Details / Address & Contact / Terms / More Info /
  Connections tabs, plus a breadcrumb (`components/Breadcrumb.tsx`).
  `lib/connections.ts` shows linked documents (Quotation → the Sales
  Order made from it, Sales Order → its Sales Invoice) and powers "Create
  Sales Order"/"Create Sales Invoice" actions that carry items and
  references across — each guarded server-side against creating a
  duplicate if one already exists, not just hidden in the UI.
- Link fields throughout (Customer Group, Territory, Item Group, UOM, etc.)
  render as `<select>`s populated from ERPNext when the service account can
  read them, falling back to a plain text input otherwise
  (`lib/linkOptions.ts`).

- **Manufacturing module (shipped 2026-09-17, several packages same day):**
  module unlocked in the Sidebar/module picker now that Inventory MVP and
  Buying are both accepted (per the Current Mission priority lock in the
  root `CLAUDE.md`). Work Orders list + read-only detail (Materials/
  Operations/Related Job Cards/Quality Readiness tabs), Work Order Create
  (`work-orders/new`, Draft-only), and **Material Transfer for Manufacture**
  (`work-orders/[name]/transfer-materials`) are all live. The transfer flow
  calls ERPNext's own whitelisted `make_stock_entry` method (the same one
  Desk's "Start" button uses) rather than recomputing outstanding-material
  math client-side — see `docs/controls/FRONTEND_GUIDE.md` §11 for the full
  native-behavior writeup, including the real live-QA-caught bug
  (`fg_completed_qty` omission silently breaking additional-material
  attachment) and why a generic `required_items` editor was deliberately
  never built (blocked by core Frappe once a Work Order is submitted).
  `lib/erpStatus.ts`'s `workOrderStatus()` tone mapping is this app's own
  reasonable choice, not a mirrored Desk `get_indicator`; `canTransferMaterials()`
  in the same file *is* a direct mirror of Desk's own `work_order.js` button
  visibility rule (read from the live ERPNext source). Still not started:
  Manufacture/finished-goods Stock Entry, Job Cards, BOM view, Workstations,
  downtime logging, live status/OEE.

## Not yet done

- Sri Lanka-specific tax handling (VAT/SVAT/WHT) — ERPNext ships no
  regional tax pack for this; document-level discounts are live (see
  above), but tax is still not started.
- Manufacturing beyond Work Order create/detail/material-transfer — Work
  Order submit/cancel actions, Job Cards, BOM view, Workstations, downtime
  logging, and live status/OEE are all separate future packages.
- Real-time notifications (needs per-user ERPNext sessions)
- `mes-service` / machine-status dashboard (the original placeholder
  homepage content — will come back once Manufacturing starts)
- PWA manifest / installability
- Optional stretch: a Three.js digital-twin view of the factory floor

## Getting started

```bash
npm install
npm run dev
```

Runs at http://localhost:3000. Needs `.env.local` (see
`.env.local.example`) with `ERPNEXT_URL`, `ERPNEXT_API_KEY`,
`ERPNEXT_API_SECRET`, and `SESSION_SECRET` set — ask whoever set up the
integration user for the API key/secret, or create a new one via ERPNext
Desk → User → API Access.
