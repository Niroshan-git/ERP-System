# ERPNext Platform Reference — Modules & Features

Compiled from the official documentation at [docs.frappe.io/erpnext](https://docs.frappe.io/erpnext/introduction), September 2026. This is the factual baseline of what ERPNext (and its companion HR app) actually contains — use it as your own reference, and as the source material to rewrite into Ceylon Stack's own marketing/product documentation (see the note at the end before you do that).

## What ERPNext Is

ERPNext is an open-source ERP built on the **Frappe framework**, licensed **GPL-3.0**. It ships as a set of modules covering accounting, sales, purchasing, inventory, manufacturing, projects, and CRM, all sharing one data model (Frappe's DocTypes) and one permissions system. HR & Payroll used to ship inside ERPNext itself; it's now a **separate open-source app, Frappe HR (`frappe/hrms`)**, installed alongside ERPNext rather than bundled into it — worth knowing since it affects what you can claim is "in the box" versus "an add-on module."

---

## Core Business Modules

### Accounting
The financial backbone — every other module posts into it.
- **Ledger & bookkeeping:** Chart of Accounts, Cost Centers, Fiscal Year setup, Journal Entries, General Ledger, an *Immutable Ledger* mode that locks posted entries
- **Receivables & payables:** Sales/Purchase Invoices, Credit/Debit Notes, Payment Entries, Payment Requests, Payment Reconciliation (incl. semi-automatic matching), Dunning/interest on overdue accounts
- **Banking:** Bank Account and Bank Transaction records, Bank Reconciliation, Payment Order, Invoice Discounting
- **Taxation:** Tax Templates (sales/purchase/item-level), Tax Withholding, tax-on-tax handling, region-specific tax rules (see Regional Compliance below)
- **Multi-currency:** exchange rate revaluation, foreign-exchange gain/loss handling, per-transaction currency
- **Budgeting & equity:** Budgets with variance reporting, Cost Center allocation/distribution, Shareholder and Share Transfer records
- **Reports:** Profit & Loss, Balance Sheet, Cash Flow, Accounts Receivable/Payable aging, customizable Financial Report Templates
- **Period control:** Period Closing Vouchers, accounting period freezes

### Selling
- Quotations → Sales Orders → Delivery Notes → Sales Invoices, with partial fulfillment, amendments, and Sales Returns
- Customer, Customer Group, Address, Contact management with credit limits
- Pricing: Price Lists, Pricing Rules, discounts/margins, Coupon Codes, Promotional Schemes, Loyalty Programs
- Sales team tracking: Sales Person, targets, commission calculation
- Blanket Orders, Drop Shipping, Inter-Company invoicing, Proforma Invoices

### Buying
- Material Request → Request for Quotation → Supplier Quotation → Purchase Order → Purchase Receipt/Invoice, plus Purchase Returns
- Supplier and Supplier Group management, Supplier Scorecards (performance tracking)
- Supplier-facing portal for quotation submission

### Stock (Inventory)
- Item master with variants, attributes, UoM conversion, Brand/Manufacturer records
- Warehouses, Stock Entries, Purchase Receipts, Delivery Notes, Stock Reconciliation
- Valuation: FIFO and Moving Average, perpetual vs. periodic inventory accounting
- Serial numbers and batch tracking (including a combined "Serial and Batch Bundle"), traceability reports
- Pick Lists, Putaway Rules, Packing Slips, Delivery Trips, Landed Cost Vouchers
- Quality Inspection tied to stock receipt, Disassembly Orders, negative-stock/COGS adjustment tooling

### Manufacturing
- Bill of Materials (multi-level, with a comparison and bulk-update tool), Routing, Workstations
- Production Plans with Material Requirements Planning (MRP), capacity planning, downtime tracking
- Work Orders → Job Cards, with stock reservation against them, a "Plant Floor" live view, and semi-finished-goods tracking
- Subcontracting as its own linked module (outsourced production, with subcontracted-inward tracking)
- Reports: Work Order Summary, Job Card Summary, BOM Stock/Explorer reports, downtime analysis, production forecasting (exponential smoothing)

### Assets
- Asset Category and Location setup, purchase-to-register workflow
- Depreciation (multiple methods, daily calculation, per-finance-book depreciation)
- Maintenance scheduling, Asset Movement, Asset Repair, Asset Value Adjustment, Asset Capitalization
- Disposal via sale or scrapping

### Projects
- Project and Task hierarchies, Project Templates and Types, multiple project views
- Timesheets with billing (to Sales Invoice or Salary Slip), time-based payouts, a built-in timer
- Project costing and profitability reporting, customer-portal visibility into project status

### CRM
- Lead → Opportunity → Quotation pipeline, Sales Stages, Appointments
- Campaigns, Email Groups, Newsletters, appointment-booking settings
- Social integrations (Twitter/LinkedIn settings), Sales Pipeline and CRM analytics reports

### Quality
- Quality Goals and Procedures, Quality Reviews, Non-Conformance and Quality Action tracking
- Quality Feedback templates and Quality Meetings — process-level QMS, distinct from the per-item Quality Inspection under Stock

### Support
- Issue tracking with Service Level Agreements, Warranty Claims
- Maintenance Visits and Maintenance Schedules

### Point of Sale
- POS Profiles per terminal/location, POS Invoice workflow, end-of-day consolidation into standard invoices

### Website & E-commerce
- Website Builder (Web Pages, Web Forms, Blog), Website Themes, a Portal with login for customers/suppliers
- Storefront: Website Items, product listings (by item group), Shopping Cart, Wishlist, Reviews & Ratings, coupon codes, a fast search option (RediSearch)

---

## HR & Payroll — separate app: Frappe HR (`frappe/hrms`)

Not part of the core `erpnext` app — installed as a companion app on the same site.
- **Org structure:** Employee, Department, Designation, Branch, Employee Grade, org chart
- **Attendance & shifts:** check-in/biometric integration, Shift Types/Assignment/Roster, attendance requests
- **Leave:** Leave Types, Policies, Allocation, Encashment, Compensatory Leave, ledger-based reporting
- **Performance:** Appraisal Cycles and Templates, Goals, 360-style feedback
- **Recruitment:** Job Requisition → Job Opening → Job Applicant → Interview → Job Offer → Appointment Letter, employee referrals
- **Lifecycle:** Onboarding, Promotion, Transfer, Separation, Skill Maps, Exit Interviews
- **Payroll:** Salary Structures/Components, Salary Slips, Payroll Entry runs, Income Tax configuration, gratuity and loan management
- **Extras:** Travel & Expense Claims, Fleet/Vehicle tracking, a mobile app with push notifications

---

## Platform-Level Capabilities (cut across every module)

- **Data Management:** bulk import/export, chart-of-accounts importer, backups, GDPR-style personal-data download/deletion tools
- **Users & Permissions:** role-based access, User Permissions (record-level restriction), field-level permission control, access logs
- **Customization:** Custom Fields, Customize Form, Client Scripts, custom Print Formats, per-company module visibility
- **Workflows & Automation:** document Workflows (state machines with approval transitions), Assignment Rules, Auto Repeat (recurring documents), Milestone tracking
- **Printing & Branding:** Print Format Builder, Letter Heads, Print Styles — **this is the mechanism for putting Ceylon Stack's own branding on every invoice/PO/report the system prints**
- **Email & Notifications:** inbound/outbound Email Accounts, Email Templates, Email Digests, Notifications, Document Follow
- **Integrations:** Google (Calendar/Contacts/Drive/Maps), payment gateways (Stripe, PayPal, RazorPay, GoCardless, Braintree, M-Pesa, Paytm), e-commerce (Shopify, WooCommerce, Amazon SP-API, Unicommerce), LDAP, Plaid, DATEV
- **Regional Compliance:** India (GST, e-invoicing, TDS), UAE/KSA (VAT), Italy, France (FEC), South Africa (VAT audit) — pattern to note for Sri Lanka: no built-in module yet, would need custom tax templates via `smart_factory` or a regional app
- **Industry Templates:** ERPNext ships lightweight starting points for Healthcare, Non-Profit, Education, Agriculture, and generic Service organizations — these reuse the core modules with different terminology/workflows layered on top, not separate codebases

---

## What's Actually Relevant to Ceylon Stack v1

Given the Smart Factory positioning, the modules that matter for the client/marketing push are: **Manufacturing, Stock, Quality, Assets**, plus enough of **Selling/Buying/Accounting** to make Work Orders and Job Cards mean something in a real order-to-cash flow. CRM, Projects, full Payroll, Website/E-commerce, and the industry templates are real ERPNext capabilities worth knowing exist (a client may ask "does it do payroll too?" — yes, via Frappe HR), but they're not what the demo needs to be built around.

## Before You Rebrand This Documentation

Two things worth being direct about, since this content is about to become Ceylon Stack's own docs:

1. **These are ERPNext's features, not Ceylon Stack's original engineering.** It's completely fair to market them as "what Ceylon Stack includes" — that's true, and it's exactly the value of building on a mature open-core ERP instead of from scratch. It stops being fair the moment the copy implies Ceylon Stack built the accounting engine or the manufacturing module from the ground up. "Powered by ERPNext" (or similar, even in small print) keeps the claim honest and actually reads as a credibility signal, not a weakness — Sri Lankan manufacturers may already know or trust ERPNext by name.
2. **GPL-3.0 stays GPL-3.0 underneath.** Rebranding the documentation, the UI text, and the Desk theme is completely fine and exactly what the headless architecture in `CLAUDE.md` is built for. What doesn't change: if a copy of ERPNext (even modified, even under a new name) is ever handed to a client to run themselves, they're entitled to the source. That obligation doesn't extend to `apps/smart_factory`, `apps/mcp-server`, `apps/mes-service`, or `apps/frontend` — those stay proprietary as long as they only talk to ERPNext over its API, per the split already documented in `CLAUDE.md` and `docs/architecture.md`.

Sources:
- [ERPNext Introduction](https://docs.frappe.io/erpnext/introduction)
- [ERPNext Documentation](https://docs.frappe.io/erpnext/)
- [Frappe HR Introduction](https://docs.frappe.io/hr/introduction)
