---
title: Product Overview
module: Getting Started
type: module-overview
status: LIVE
last_verified: 2026-09-25
---

## Overview

Ceylon Stack is a business platform for Sri Lankan manufacturers and service businesses, built on
ERPNext — open-source, enterprise-grade business software — with a purpose-built client dashboard
and (once the manufacturing layer ships) a real-time factory-floor layer on top.

ERPNext helps a company stay on top of operations: inventory, finance, sales, purchasing,
projects, and more — all built in, with no paywalled modules. Ceylon Stack takes that proven
core, keeps it completely unmodified, and adds a custom-built client-facing dashboard plus live
machine and shop-floor data — the parts ERPNext doesn't ship out of the box.

> [!INFO]
> Positioning line: "Ceylon Stack — the smart factory platform for manufacturers who need more
> than a spreadsheet and less than an SAP rollout."

## Purpose

This documentation is organized in three layers, all generated from the same markdown source:

- **Product Guide** — how to actually use each business document (Quotation, Work Order, Lead,
  and so on): what it's for and how to create/edit/submit it.
- **Implementation Guide** — what must be configured before a module or document can be used
  (master data, prerequisites, roles).
- **Technical Architecture** — the canonical field/entity/Frappe mapping for developers, indexed
  from `docs/backend/`.

Use the mode tabs in the top bar to filter any page down to just one of these layers, or leave
"All" selected to see everything at once.

Every feature is labeled with one of these statuses. Nothing here is marketing copy — a "Live"
label means it is running against the real ERPNext instance today, not a mockup.

- **Live** — shipped and verified against the real ERPNext instance.
- **Building** — actively in development, partially working.
- **Planned** — scoped and sequenced, not started.
- **Needs Verification** — implemented but not yet live-confirmed.

> [!WARN]
> This build is not yet public. Everything documented here runs on a private pilot instance
> (Hetzner-hosted) used for internal development and demos.

## Main Functions

Live Today  
The full release history — every shipped feature, its verification status, and the changelog —
lives in the **Release Log** section of this page (unchanged from before this documentation
upgrade, still owned by the `release-tracker` subagent).

Product Guide  
Sales, Manufacturing, CRM, and Finance each have a module Overview plus at least one flagship
business-document page (Quotation, Work Order, Lead) written to the full documentation standard —
see the sidebar. Coverage grows as `docs/product/` is extended package by package; it is not yet
complete for every shipped document.

Technical Architecture  
Indexed from `docs/backend/`, the canonical Frappe/ERPNext-mapping knowledge base — see the
Technical Architecture section at the bottom of this page.

## Related Documents

See `docs/architecture/decisions/README.md` (ADR-008) for the architecture decision behind this
documentation platform, and `docs/controls/BACKEND_KNOWLEDGE_POLICY.md` for how the Technical
Architecture layer is governed.
