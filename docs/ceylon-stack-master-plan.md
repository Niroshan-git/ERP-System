# CEYLON STACK — MASTER PRODUCT & BUSINESS BUILD PLAN

**Status:** North-star reference. Not a binding control document — `docs/controls/` remains the
single source of truth for process rules (see `CLAUDE.md`). This document sets the long-term
product/business vision and the roadmap-stage sequencing that `docs/ceylon-stack-master-backlog.md`
audits the current repository against.

**Provenance:** authored by Niroshan, supplied 2026-09-18. Saved verbatim as a durable doc per the
document's own Section 29 ("North Star") intent.

---

## 1. PURPOSE

Ceylon Stack is not intended to become only another ERP interface.

The long-term goal is to create an **SME Business Operating System** combining:

- ERP
- CRM
- Manufacturing
- Finance
- Workflow
- Approvals
- Analytics
- Self-service reporting
- Excel modeling
- Planning and forecasting
- AI
- Automation
- Mobile operations

However, these capabilities MUST NOT all be developed simultaneously.

The product must be built in controlled layers.

> **Foundation → Transactions → Workflow → Intelligence → AI → Mobile → Scale**

Every advanced capability must depend on stable business data and validated business processes underneath it.

---

# 2. COMPANY MISSION

## Mission

Help SMEs move from fragmented manual operations, spreadsheets, disconnected accounting systems, and delayed management reporting into connected, intelligent business operations.

## Vision

Build a practical SME technology ecosystem where:

**Business Transactions → Data → Workflow → Analytics → AI → Action**

operate as one connected platform.

Ceylon Stack should eventually allow management to:

- Operate the company
- Approve transactions
- Monitor performance
- Build reports
- Create financial models
- Forecast results
- Analyze Excel files
- Ask questions using AI
- Trigger workflows
- Operate through mobile devices

from one business platform.

---

# 3. COMPANY BUSINESS MODEL

The company must NOT depend entirely on Ceylon Stack revenue during the early stages.

The company operates through five interconnected business lines.

### Business Consulting

- Business process assessment
- GAP analysis
- Digital maturity assessment
- ERP readiness
- Process redesign
- Solution architecture
- Financial/process advisory

### SME Automation

- Excel automation
- Database solutions
- Power Query
- Workflow automation
- n8n / integration
- Approval automation
- Data consolidation

### Data & Business Intelligence

- Power BI
- Microsoft Fabric
- Executive dashboards
- Financial analytics
- Manufacturing analytics
- Supply-chain analytics
- Forecasting
- Data modeling

### ERP Solutions

Two ERP strategies:

**Odoo**
- Established ERP
- Complex customers
- Customers requiring mature ecosystem
- Odoo implementation/customization/support

**Ceylon Stack**
- SME-focused
- Simpler implementation
- Modern UX
- Workflow-first
- Intelligence-first
- AI-enabled
- Mobile-enabled

### Tax & Financial Advisory

Led primarily by the second director.

Tax/accounting engagements can expose:

- Poor inventory control
- Delayed accounts
- Excel dependency
- Weak reporting
- Manual reconciliation
- Missing approval controls
- Cash-flow visibility problems

These problems become potential consulting, automation, analytics and ERP opportunities.

---

# 4. COMPANY FLYWHEEL

```text
Tax / Advisory
      ↓
Business Assessment
      ↓
GAP Analysis
      ↓
────────────────────────────────────
↓              ↓             ↓
Automation     BI           ERP
↓              ↓             ↓
Excel/DB    Analytics    Odoo/Ceylon
────────────────────────────────────
              ↓
          Workflow
              ↓
          Data Layer
              ↓
        Intelligence
              ↓
              AI
              ↓
        Mobile Operations
              ↓
       Recurring Support
              ↓
          Case Studies
              ↓
        New Customers
```

One customer can therefore generate multiple revenue opportunities without aggressively selling unnecessary software.

---

# 5. PRODUCT ARCHITECTURE

The target architecture is:

```text
                    CEYLON STACK
                          │
 ┌────────────────────────┼────────────────────────┐
 │                        │                        │
OPERATIONS            INTELLIGENCE              ACTION
 │                        │                        │
CRM                 Dashboards                Workflow
Sales               Report Builder            Approvals
Purchasing          Modeling Studio           Notifications
Inventory           Excel Workspace           Automation
Manufacturing       Forecasting               Tasks
Finance             Planning                  Mobile
 │                        │                        │
 └────────────────────────┼────────────────────────┘
                          │
                     AI PLATFORM
                          │
              Natural Language Assistant
              Analysis
              Report Generation
              Forecast Assistance
              Workflow Assistance
              Business Explanation
```

---

# 6. CRITICAL BUILD PRINCIPLE

DO NOT build this architecture horizontally.

Build it vertically in controlled stages.

The required sequence is:

```text
ERP FOUNDATION
      ↓
CORE MODULES
      ↓
TRANSACTION LOGIC
      ↓
MASTER DATA
      ↓
ACCOUNTING / STOCK INTEGRITY
      ↓
WORKFLOW ENGINE
      ↓
APPROVAL ENGINE
      ↓
ANALYTICS DATA LAYER
      ↓
REPORT BUILDER
      ↓
MODELING / PLANNING
      ↓
AI
      ↓
MOBILE
      ↓
ADVANCED AUTOMATION
```

Claude and Codex must respect this dependency sequence.

---

# 7. PHASE 1 — COMPLETE ERP FOUNDATION

## Objective

Create a complete, stable transactional ERP before adding advanced intelligence features.

## Core Modules

### CRM

Build:

- Leads
- Opportunities
- Activities
- Pipeline
- Contacts
- Customers
- Sales follow-ups
- Lead conversion
- Opportunity stages
- Salesperson management

CRM is strategically important because it represents the beginning of the customer business lifecycle.

```text
Lead
 ↓
Opportunity
 ↓
Quotation
 ↓
Customer
 ↓
Sales Order
 ↓
Delivery
 ↓
Invoice
 ↓
Payment
```

---

## Sales

Build:

- Quotations
- Sales Orders
- Delivery
- Sales Invoice
- Returns
- Credit Notes
- Pricing
- Discounts
- Customer credit control

---

## Procurement

Build:

```text
Purchase Request
       ↓
RFQ
       ↓
Supplier Quotation
       ↓
Purchase Order
       ↓
GRN
       ↓
Supplier Invoice
       ↓
Payment
```

Support three-way matching:

```text
PO
 ↕
GRN
 ↕
AP Invoice
```

---

## Inventory

Build:

- Warehouses
- Stock transactions
- Transfers
- Receipts
- Issues
- Batch
- Serial
- UOM
- Stock valuation
- Reorder levels
- Stock availability

---

## Manufacturing

Build:

```text
Sales Demand
     ↓
Planning
     ↓
BOM
     ↓
Production Order
     ↓
Material Requirement
     ↓
Material Issue
     ↓
WIP
     ↓
Production
     ↓
Finished Goods Receipt
     ↓
Production Cost
```

Include:

- BOM
- Routing
- Work centers
- Production orders
- Material issue
- Material receipt
- WIP
- Scrap
- Production costing
- Planning
- Capacity concepts

---

## Finance

Finance must be deeply integrated rather than treated as a separate isolated module.

Build:

- Chart of Accounts
- Journal Entry
- AR
- AP
- Payments
- Receipts
- Bank
- Tax
- Cost Centers
- Projects/dimensions
- Trial Balance
- General Ledger
- P&L
- Balance Sheet
- Cash Flow

Every relevant transaction must clearly define:

**Operational Event → Accounting Impact**

---

# 8. CENTRAL MASTER DATA

Master data MUST NOT belong conceptually to individual modules.

Create a centralized Master Data domain.

Examples:

- Business Partner
- Customer
- Supplier
- Item
- Item Group
- UOM
- Warehouse
- Employee
- Tax Code
- Currency
- Payment Terms
- Price Lists
- Projects
- Cost Centers
- Dimensions

Modules consume master data.

They should not create competing copies of it.

```text
             MASTER DATA
                  │
     ┌────────────┼────────────┐
     │            │            │
    CRM         Sales       Purchasing
     │            │            │
     └────────────┼────────────┘
                  │
              Inventory
                  │
            Manufacturing
                  │
               Finance
```

This architecture is essential for the future reporting/modeling layer.

---

# 9. PHASE 2 — WORKFLOW ENGINE

Only begin after transactional modules are stable.

Workflow must become a platform capability rather than hard-coded approval logic inside every module.

Examples:

```text
Document Created
      ↓
Rule Evaluation
      ↓
Approval Required?
      ↓
Approver Determination
      ↓
Notification
      ↓
Approve / Reject
      ↓
Next Stage
```

Workflow rules could eventually support:

- Document type
- Value
- Department
- Branch
- User
- Role
- Customer
- Supplier
- Margin
- Credit exposure
- Budget
- Stock availability

---

# 10. PHASE 3 — APPROVAL PLATFORM

Build approvals on top of workflow.

Examples:

- Purchase Order approval
- Sales discount approval
- Customer credit approval
- Journal Entry approval
- Payment approval
- Production approval
- Expense approval
- Budget approval

Approval Center:

```text
MY APPROVALS

Purchase Orders      7
Payments             3
Discount Requests    2
Production Orders    4
Journal Entries      1
```

This eventually becomes one of the major mobile use cases.

---

# 11. PHASE 4 — ANALYTICS DATA FOUNDATION

DO NOT build the self-service report designer directly against random transactional tables.

Create a governed analytics layer.

Conceptually:

```text
ERP DATABASE
     ↓
BUSINESS DATA MODEL
     ↓
SEMANTIC / METRIC LAYER
     ↓
REPORTING
```

Examples of standardized metrics:

- Revenue
- Gross Profit
- Gross Margin
- Inventory Value
- DSO
- DPO
- Production Cost
- Purchase Variance
- Budget Variance
- Customer Balance
- Cash Position

A metric should have ONE governed definition.

---

# 12. PHASE 5 — REPORT BUILDER

Once the analytics layer is reliable, introduce self-service reporting.

Users should be able to create:

- Tables
- Matrix reports
- KPIs
- Bar charts
- Line charts
- Pie/donut charts
- Trend reports
- Variance reports
- Financial reports
- Dashboards

Concept:

```text
DATASETS

Sales
Purchasing
Inventory
Manufacturing
Finance
CRM

       ↓

Select Fields

       ↓

Dimensions + Measures

       ↓

Filter / Group / Sort

       ↓

Visualization

       ↓

Save Report

       ↓

Dashboard / Export / Schedule
```

---

# 13. PHASE 6 — MODELING STUDIO

This is where Ceylon Stack begins moving beyond traditional ERP.

Users should be able to build business models.

Examples:

### Financial Modeling

- Revenue assumptions
- Expense assumptions
- Gross margin
- Cash flow
- Working capital
- Budget
- Forecast

### Sales Planning

- Growth assumptions
- Territory forecasts
- Product forecasts
- Salesperson targets

### Manufacturing Planning

- Demand forecast
- Material requirement
- Production capacity
- Cost simulation

### Scenario Analysis

Support:

```text
Actual
Budget
Forecast
Best Case
Base Case
Worst Case
```

Users can modify assumptions and immediately see resulting calculations.

---

# 14. PHASE 7 — EXCEL WORKSPACE

Excel must be treated as an integration surface rather than an enemy.

Allow:

```text
Upload Excel
     ↓
Select Sheet
     ↓
Detect Columns
     ↓
Clean / Transform
     ↓
Map Fields
     ↓
Join ERP Data
     ↓
Create Calculations
     ↓
Build Model
     ↓
Analyze
     ↓
Save / Export
```

Example:

Finance uploads:

`FY2027_Budget.xlsx`

Ceylon Stack can map:

```text
Account Code
Department
Month
Budget
```

against:

```text
ERP Actual GL
```

and produce:

**Actual vs Budget vs Forecast.**

---

# 15. PHASE 8 — FORECASTING & PREDICTION

Examples:

- Sales forecasting
- Demand forecasting
- Cash-flow forecasting
- Inventory requirements
- Customer payment behavior
- Purchasing requirements
- Production demand

Models must expose:

- Source data
- Forecast horizon
- Assumptions
- Model/method
- Confidence or uncertainty where applicable
- Last refresh

Predictions must never silently replace actual accounting/ERP data.

---

# 16. PHASE 9 — AI ANALYST

AI should sit ABOVE governed business services.

DO NOT allow AI to freely query uncontrolled production data and invent business definitions.

Architecture:

```text
USER
 │
"Why did margin decrease?"
 │
AI
 │
Intent Understanding
 │
Metric / Dataset Selection
 │
Governed Query
 │
Validation
 │
Execution
 │
Result
 │
Explanation
```

Potential AI capabilities:

### AI Report Builder

User:

> Build a monthly sales dashboard showing revenue, margin and quantity by region.

AI:

1. Identifies Sales dataset
2. Selects governed metrics
3. Generates report specification
4. Validates
5. Creates report
6. Allows user modification

### AI Excel Analyst

User uploads Excel and asks:

> Compare this budget against our ERP actuals and identify major variances.

### AI Financial Analyst

> Forecast cash flow for six months.

### AI Management Assistant

> What are the five biggest problems requiring my attention today?

### AI Workflow Assistant

> Show purchase orders waiting more than three days for approval.

---

# 17. AI SAFETY / GOVERNANCE

AI must respect:

- User permissions
- Company
- Branch
- Department
- Data access
- Document access
- Financial access

AI should NOT bypass ERP authorization.

AI actions should follow:

```text
AI REQUEST
    ↓
PERMISSION
    ↓
BUSINESS RULE
    ↓
VALIDATION
    ↓
CONFIRMATION
    ↓
ACTION
    ↓
AUDIT LOG
```

Sensitive actions require explicit confirmation.

---

# 18. PHASE 10 — MOBILE APPLICATION

Do NOT attempt to reproduce the entire desktop ERP on mobile.

Mobile should focus on high-value actions.

## Management Mobile

- Executive dashboard
- Cash position
- Sales
- Receivables
- Payables
- Inventory
- Production
- Alerts

## Approvals

- PO
- Payments
- Discounts
- Expenses
- Production
- Journal Entries

## Operational Mobile

- Stock lookup
- Barcode
- GRN
- Stock transfer
- Production issue
- Production receipt
- Customer lookup

## AI Mobile

Management should eventually be able to ask:

> How much did we sell today?

> Which customers owe us the most?

> Why did gross margin fall?

> What approvals need my attention?

---

# 19. END-STATE USER EXPERIENCE

Eventually:

```text
                  CEYLON STACK
                        │
        ┌───────────────┼───────────────┐
        │               │               │
      DESKTOP          MOBILE           AI
        │               │               │
Transactions        Approvals        Questions
Reporting           Alerts           Analysis
Modeling            KPIs             Reports
Planning            Actions          Forecasts
        │               │               │
        └───────────────┼───────────────┘
                        │
                  BUSINESS PLATFORM
```

---

# 20. BUILD ROADMAP

## STAGE 01 — ERP CORE

**Priority: NOW**

Complete:

- CRM
- Sales
- Purchasing
- Inventory
- Manufacturing
- Finance
- Master Data

Goal:

> Complete end-to-end business transactions.

---

## STAGE 02 — BUSINESS INTEGRITY

Validate:

- Stock impact
- Accounting impact
- Document lifecycle
- Relationships
- Master data
- Permissions
- Audit trails
- Tax
- Costing

Goal:

> Trustworthy ERP.

---

## STAGE 03 — WORKFLOW + APPROVALS

Build:

- Workflow engine
- Rule engine
- Approval engine
- Notifications
- Escalation
- Approval inbox

Goal:

> Controlled ERP.

---

## STAGE 04 — MANAGEMENT INTELLIGENCE

Build:

- Standard dashboards
- KPIs
- Financial reports
- Operational reports
- Excel/PDF export
- Scheduled reports

Goal:

> Management-visible ERP.

---

## STAGE 05 — SELF-SERVICE REPORTING

Build:

- Dataset catalog
- Dimensions
- Measures
- Filters
- Report designer
- Visualization builder
- Dashboard designer

Goal:

> User-configurable ERP intelligence.

---

## STAGE 06 — MODELING + EXCEL

Build:

- Excel import
- Mapping
- Calculations
- Planning models
- Budgeting
- Scenario analysis
- Forecasting

Goal:

> ERP + business planning platform.

---

## STAGE 07 — AI

Build:

- AI assistant
- AI report creation
- AI analysis
- AI Excel analysis
- AI forecasting assistance
- AI workflow assistance

Goal:

> Intelligent ERP.

---

## STAGE 08 — MOBILE

Build:

- Executive mobile
- Approval mobile
- Operational mobile
- AI mobile

Goal:

> ERP available at the point of decision.

---

## STAGE 09 — AUTOMATION ECOSYSTEM

Build:

- Webhooks
- API
- MCP
- n8n
- Email
- WhatsApp where appropriate
- External integrations
- Scheduled automation
- Event-driven automation

Goal:

> Connected business operating system.

---

# 21. IMPORTANT: REPORTING MUST NOT DELAY ERP RELEASE

Separate:

### Standard Reporting

Needed for initial ERP release.

Examples:

- Sales Analysis
- Purchase Analysis
- Inventory
- Aging
- P&L
- Balance Sheet
- Cash Flow
- Manufacturing Cost

### Advanced Reporting Platform

Built later.

Includes:

- Self-service report builder
- Semantic model
- Modeling
- Excel
- Forecasting
- AI

This distinction is mandatory.

---

# 22. PRODUCT PACKAGING

Eventually consider:

## Ceylon Stack Core

ERP modules.

## Ceylon Stack Workflow

Workflow + approvals + automation.

## Ceylon Stack Intelligence

Reporting + dashboards + analytics.

## Ceylon Stack Planning

Budget + forecast + scenario + Excel modeling.

## Ceylon Stack AI

AI analyst + AI assistant.

## Ceylon Stack Mobile

Management + operational mobile capabilities.

Packages can later become commercial tiers or add-ons.

Do not finalize pricing until infrastructure and support economics are validated.

---

# 23. BUSINESS SERVICES AROUND THE PRODUCT

The company should continue selling:

- GAP Analysis
- ERP Consulting
- Odoo Implementation
- Ceylon Stack Implementation
- Power BI
- Microsoft Fabric
- Excel Automation
- Data Engineering
- Business Automation
- AI Automation
- Tax/Financial Advisory
- Training
- Support

These generate cash while the product matures.

---

# 24. CUSTOMER ACQUISITION PATH

Do not expect every lead to immediately purchase ERP.

Possible entry points:

```text
                SME CLIENT
                    │
          Digital Health Check
                    │
        ┌───────────┼────────────┐
        │           │            │
      Excel        BI          Process
   Automation   Dashboard     Consulting
        │           │            │
        └───────────┼────────────┘
                    │
                ERP READY
                    │
          ┌─────────┴─────────┐
          │                   │
        ODOO             CEYLON STACK
          │                   │
          └─────────┬─────────┘
                    │
              Support / AMC
                    │
              Intelligence
                    │
              AI / Automation
```

---

# 25. DEVELOPMENT GOVERNANCE

Claude and Codex must not expand scope merely because a future capability appears in this document.

For every package determine:

1. Which roadmap stage does it belong to?
2. Is the previous dependency complete?
3. Is the feature required for current release?
4. Is backend behavior understood?
5. Is master data impact understood?
6. Is accounting impact understood?
7. Is stock impact understood?
8. Are permissions understood?
9. Is API impact understood?
10. Is reporting impact documented?

If a future requirement appears while implementing current modules:

**Document it. Do not automatically build it.**

---

# 26. DEFINITION OF ERP CORE COMPLETE

Do NOT declare Stage 01/02 complete simply because screens exist.

ERP core is complete only when:

- Required modules exist
- End-to-end processes work
- Transactions persist correctly
- Relationships are correct
- Master data is centralized
- Accounting impacts are verified
- Inventory impacts are verified
- Manufacturing impacts are verified
- Permissions work
- Audit history works
- Errors are handled
- Required standard reports work
- Critical tests pass
- Backend documentation reflects actual implementation

---

# 27. IMMEDIATE EXECUTION PRIORITY

The current mission is:

> **FINISH THE ERP CORE FIRST.**

Current implementation order:

```text
1. Complete remaining ERP modules
           ↓
2. Validate backend/domain behavior
           ↓
3. Consolidate Master Data
           ↓
4. Complete transaction relationships
           ↓
5. Validate Finance / Stock / Manufacturing
           ↓
6. Stabilize permissions + audit
           ↓
7. Standard operational reports
           ↓
8. ERP CORE RELEASE
           ↓
9. Workflow Engine
           ↓
10. Approval Platform
           ↓
11. Analytics / Semantic Layer
           ↓
12. Report Builder
           ↓
13. Modeling / Excel / Planning
           ↓
14. AI Platform
           ↓
15. Mobile Application
           ↓
16. Advanced Automation
```

Do not reverse this sequence without an architectural reason documented in the repository.

---

# 28. CLAUDE EXECUTION INSTRUCTION

Review the existing Ceylon Stack repository and compare the actual implementation against this master plan.

Do NOT immediately start coding new future-stage functionality.

First:

1. Establish current repository state from Git.
2. Read existing governance documents.
3. Read architecture documentation.
4. Identify currently completed modules.
5. Identify partially completed modules.
6. Identify missing ERP core functionality.
7. Identify backend knowledge gaps.
8. Identify Master Data duplication.
9. Identify accounting/stock/manufacturing integration gaps.
10. Identify existing reporting capabilities.
11. Map every existing capability to the roadmap stages above.
12. Create a dependency-aware implementation backlog.
13. Separate:
   - CURRENT RELEASE
   - NEXT
   - LATER
   - RESEARCH
14. Estimate packages rather than attempting one massive implementation.
15. Preserve all existing governance between Claude and Codex.

The immediate build queue must remain focused on completing the transactional ERP foundation.

Future capabilities — workflow, approvals, reporting studio, modeling, Excel analytics, forecasting, AI and mobile — should be documented architecturally now but implemented only when their dependencies are ready.

---

# 29. NORTH STAR

The long-term product is not:

> "An ERP with AI."

The target is:

> **A connected SME Business Operating System where transactions, finance, workflows, analytics, planning, AI and mobile actions operate from one governed business data foundation.**

The competitive advantage should come from connecting these layers rather than attempting to build the largest possible collection of ERP features.

The progression is:

**Run the Business → Control the Business → Understand the Business → Plan the Business → Ask the Business → Operate Anywhere.**
