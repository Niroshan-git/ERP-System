# Graph Report - D:/_07_ERP/ERP System  (2026-09-19)

## Corpus Check
- 12 files · ~617,961 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1694 nodes · 4152 edges · 176 communities (116 shown, 60 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 56 edges (avg confidence: 0.76)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Buying Reports Hub
- Buying & Manufacturing Detail Pages
- Shared Data Table Components
- Backend Knowledge Docs (Manufacturing/Architecture)
- Sales Master Data Create Pages
- Buying List Pages
- Manufacturing & Delivery List Pages
- Master Data Create Actions
- Relationship Map Components
- MCP Server Config & ERPNext Client
- App Shell & Navigation
- Sales Dashboard & Charts
- Cross-Module Detail Pages
- Frontend Build Config
- Delivery Note Actions
- RFQ & Campaign Create Flows
- Line Items Editor & Pricing
- Purchase Order Actions
- Sales Invoice from Delivery Note
- Purchase Invoice Actions
- List Pages (Filters & Sort)
- New Document Create Pages
- Cross-Document Creation Flows
- Work Order Material Transfer
- Stock Balance Page
- ERP System — apps/frontend README
- docs — Smart Factory Module Declaration
- package — Applied Dashboard UI Preview
- purchase-receipts — actions
- frontend — eslint
- orders — actions
- agents — CLAUDE.md (master control entry point)
- lib — CreatePurchaseInvoiceFromPurchaseOrderPage
- ERP System — Hetzner Cloud infrastructure
- ERP System — Ceylon Services App Overview
- frontend — jspdf-autotable
- suppliers — SupplierForm
- work-orders — actions
- customers — CustomerForm
- pick-lists — actions
- supplier-quotations — actions
- addresses — actions
- agents — MES/OEE Service App
- lib — route
- items — ItemForm
- stock-entries — actions
- actions — WorkOrderForm
- quotations — actions
- actions — CopyFromQuotationPanel
- components — PickListLocationsTable
- sales-partners — actions
- batches — actions
- scripts — CompletedProcess
- lib — jspdf
- material-requests — actions
- components — SellingSettingsFormShell
- serial-nos — actions
- frontend — package.json
- [name] — DocLink
- actions — BatchSerialPicker
- mcp-server — Manufacturing module (apps/frontend)
- create-supplier-quotation — CreateSupplierQuotationForm
- transfer-materials — actions
- material-requests — MaterialRequestsPage
- purchase-orders — PurchaseOrdersPage
- purchase-receipts — PurchaseReceiptsPage
- quotations — QuotationsPage
- stock-entries — PURPOSE_OPTIONS
- docs — What's Inside ERPNext (Feature Pack)
- ERP System — ACCESS.md — Server, Repo & Command Reference
- docker — backend/db/queue/scheduler/websocket services
- lib — route
- components — PurchaseInvoiceForm
- create-invoice — CreateSalesInvoiceFromSalesOrderPage
- app — layout
- decisions — Architecture Decision Records doc
- (app) — HomePage
- docs — Industries & Fit (8 Sri Lankan Segments)
- docs — Discount Logic Comparison
- ceylon_services — install
- ceylon_services — provisioning
- login — LoginForm
- controls — Mission Lock Drift Note
- docs — Cancellation & Amendment Logic
- docs — Practice Site Setup Steps (bench new-site)
- .mcp.json
- ceylon_services — boot
- ceylon_services — ceylon_services Proprietary License
- ceylon_services — ceylon_services Pre-commit Hooks Config
- frontend — Next.js Agent Rules Notice (auto-generated bre...
- frontend — eslint.config.mjs
- frontend — next.config
- frontend — postcss.config.mjs
- smart_factory — boot
- brand — Three Type Faces, Three Jobs
- controls — Definition of Ready
- scripts — add-nip-io-alias.sh
- scripts — sync-app-branch.sh
- config — __init__
- ceylon_services — hooks
- ceylon_services — __init__
- ceylon_services — ceylon_services modules.txt (module reg...
- ceylon_services — ceylon_services patches.txt (migration ...
- patches — __init__
- templates — __init__
- pages — __init__
- mcp-server — mcp-server Python Dependencies (mcp, httpx, ...
- src — __init__
- config — __init__
- smart_factory — hooks
- patches — __init__
- js — ceylon_stack_desk.js
- smart_factory — __init__
- templates — __init__
- pages — __init__
- ERP System — Ceylon Stack Naming & Positioning
- ERP System — Ceylon Stack Color Tokens (sapphire/cinnamon...
- docs — Multi-Client Path (Frappe Multi-Site)
- 05-manufacturing — Manufacturing Documentation Scope (202...
- docs — The Offer (Sri Lanka Market Segments)
- Brand Naming & Positioning
- Brand Color Tokens
- Logo & Mark Assets
- Brand Typography
- Brand Voice & Tone Guidelines
- Underlying Stack Explainer
- Multi-Site Client Path
- Manufacturing Docs Scope
- Ceylon Stack Brand Voice
- Frontend Type System
- ERPNext Desk Branding
- Partial Fulfillment & Copy From Quotation
- Reports, Bulk Actions & Settings
- Sales Documents Status
- GPL-3.0 Licensing
- Product Portfolio & Multi-Tenant Hosting
- AI Agents (MCP) Planned
- Platform Hardening Planned
- Product Portfolio Roadmap
- Extension Points Around ERPNext
- Licensing Playbook
- Sri Lanka Market Segments
- Objection Handling
- Sales Scenario Capture
- Reusable Component Guidelines
- Document Definition of Done
- Standard Document Pattern
- Accounting Module Reference
- Buying Module Reference
- Other Modules Reference
- Platform-Level Capabilities
- Selling Module Reference
- ceylon_services App
- smart_factory App
- PROGRESS.md Log
- QA_LOG.md Log

## God Nodes (most connected - your core abstractions)
1. `fetchLinkOptions()` - 99 edges
2. `listDocs()` - 58 edges
3. `getDoc()` - 57 edges
4. `ErpNextError` - 54 edges
5. `getCount()` - 40 edges
6. `parsePage()` - 39 edges
7. `parsePageSize()` - 39 edges
8. `paginate()` - 39 edges
9. `listItemOptions()` - 39 edges
10. `getConnections()` - 37 edges

## Surprising Connections (you probably didn't know these)
- `Two-tier access model (dev tier vs client tier)` --semantically_similar_to--> `Current Mission Priority Lock`  [INFERRED] [semantically similar]
  apps/mcp-server/README.md → CLAUDE.md
- `DevOps Agent` --shares_data_with--> `ACCESS.md — Server, Repo & Command Reference`  [INFERRED]
  .claude/agents/devops.md → ACCESS.md
- `PLAN.md (week-by-week build plan)` --references--> `Week 7-8: Mobile-Friendly Frontend + Dashboards`  [EXTRACTED]
  .claude/agents/erp-functional-consultant.md → PLAN.md
- `Manufacturing Packages 2/3/5 Governance-Closure Corrections (CX-MFG-001-006)` --references--> `CX-MFG-001: unbound Work Order identity in material-transfer server actions`  [EXTRACTED]
  QA_LOG.md → docs/operations/AI_WORK_LOG.md
- `Agro-Processing Specialist Agent` --references--> `CLAUDE.md (master control entry point)`  [EXTRACTED]
  .claude/agents/agro-processing.md → CLAUDE.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Manufacturing Packages 2/3/5 combined Codex review/remediation cycle** — docs_operations_ai_work_log_manufacturing_package_2, docs_operations_ai_work_log_manufacturing_package_3, docs_operations_ai_work_log_manufacturing_package_5, docs_operations_ai_work_log_cx_mfg_001, docs_operations_ai_work_log_cx_mfg_002 [INFERRED 0.85]
- **Master Data Canonicalization pattern applied across domains** — docs_operations_ai_work_log_master_data_navigation_foundation_md1, docs_operations_ai_work_log_master_data_item_domain, docs_operations_ai_work_log_master_data_business_partner_domain, docs_controls_frontend_guide_master_data_routes [EXTRACTED 0.90]
- **Current Mission priority lock sequencing reflected across control and product docs** — claude_document, docs_controls_frontend_guide_module_priority_order, docs_ceylon_stack_documentation_roadmap_manufacturing, docs_ceylon_stack_documentation_frontend_buying, docs_ceylon_stack_documentation_frontend_inventory [INFERRED 0.85]
- **Master Data Canonicalization Program (Nav Shell + Item + Business Partner Domains)** — progress_master_data_canonicalization, qa_log_master_data_item_domain_qa, qa_log_master_data_business_partner_qa, docs_operations_ai_work_log_md_item_domain, docs_operations_ai_work_log_md1_package, docs_operations_ai_work_log_cx_md_001 [EXTRACTED 1.00]
- **Competing Ceylon Stack Color Token Systems** — docs_brand_md_color_tokens, docs_brand_ceylon_stack_branding_color_palette, docs_brand_package_ceylon_stack_frontend_design_color_palette [INFERRED 0.75]
- **MCP Agent Roster Across Docs** — docs_ceylon_stack_playbook_agent_roster, docs_mcp_agents_plan_phase2_agents, docs_ceylon_stack_documentation_roadmap_agents [INFERRED 0.85]
- **Package closure / Definition of Done workflow** — claude_package_closure_rules, claude_agents_code_reviewer, claude_agents_qa_tester, claude_agents_release_tracker, qa_log, progress [INFERRED 0.85]
- **Apps implementing the headless architecture split** — claude_headless_architecture, claude_smart_factory_app, claude_frontend_app, claude_mes_service_app, claude_mcp_server_app [INFERRED 0.85]
- **Stock-Entry-driven material deviation pattern** — docs_backend_05_manufacturing_work_order_work_order, docs_backend_05_manufacturing_material_transfer_material_transfer, docs_backend_05_manufacturing_material_transfer_mfg_stk_001, docs_backend_05_manufacturing_work_order_mfg_wf_002 [EXTRACTED 1.00]
- **Backend knowledge capture documentation pipeline** — docs_controls_backend_knowledge_policy_backend_knowledge_policy, docs_backend_00_architecture_readme_canonical_model_layer_stack, docs_backend_15_migration_migration_status_migration_status_table, docs_backend_99_unverified_unverified_behaviours_unverified_behaviours [INFERRED 0.85]
- **Agent governance binding control document system** — docs_controls_agent_operating_guide_agent_operating_guide, docs_controls_agent_usage_policy_agent_usage_policy, docs_controls_development_system_rules_development_system_rules, docs_controls_frontend_guide_frontend_guide [EXTRACTED 1.00]

## Communities (176 total, 60 thin omitted)

### Community 0 - "Buying Reports Hub"
Cohesion: 0.06
Nodes (52): createCampaignAction(), FormState, TEXT_KEYS, updateCampaignAction(), CampaignDoc, fields, fields, createSalesPartnerAction() (+44 more)

### Community 1 - "Buying & Manufacturing Detail Pages"
Cohesion: 0.13
Nodes (35): MaterialRequestDoc, PurchaseInvoiceDoc, PurchaseOrderDoc, PurchaseReceiptDoc, RfqDoc, SupplierQuotationDoc, DeliveryNoteDoc, SalesInvoiceDoc (+27 more)

### Community 2 - "Shared Data Table Components"
Cohesion: 0.06
Nodes (44): CreatePurchaseInvoiceFromPurchaseOrderPage(), PurchaseOrderForSelection, PurchaseOrderItemForSelection, PurchaseOrderForSelection, PurchaseOrderItemForSelection, CreatePurchaseInvoiceFromPurchaseReceiptPage(), PurchaseReceiptForSelection, PurchaseReceiptItemForSelection (+36 more)

### Community 3 - "Backend Knowledge Docs (Manufacturing/Architecture)"
Cohesion: 0.11
Nodes (36): ColumnPicker(), DataTable(), columns, columns, columns, ProgressBar(), columns, columns (+28 more)

### Community 4 - "Sales Master Data Create Pages"
Cohesion: 0.06
Nodes (51): Architecture Decision Records, Canonical Mapping Standard, Canonical Model Layer Stack, FRAPPE_CURRENT_BEHAVIOR tag, FRAPPE_ONLY_IMPLEMENTATION_DETAIL tag, REQUIRED_CEYLON_BEHAVIOR tag, Two Backends, One Product, Job Card (read-only fields) (+43 more)

### Community 5 - "Buying List Pages"
Cohesion: 0.08
Nodes (33): Config, load_config(), Configuration loading for the Ceylon Stack ERPNext MCP server., Load and validate required ERPNext connection settings.      Raises RuntimeError, ERPNextClient, ERPNextError, _extract_error(), _json() (+25 more)

### Community 6 - "Manufacturing & Delivery List Pages"
Cohesion: 0.10
Nodes (34): buildInvoiceItemFromPurchaseOrder(), buildInvoiceItemFromPurchaseReceipt(), buildPurchaseInvoiceFields(), cancelPurchaseInvoiceAction(), createPurchaseInvoiceAction(), createPurchaseInvoiceFromPurchaseOrder(), createPurchaseInvoiceFromPurchaseOrderAction(), createPurchaseInvoiceFromPurchaseReceipt() (+26 more)

### Community 7 - "Master Data Create Actions"
Cohesion: 0.08
Nodes (31): AppLayout(), FullscreenToggle(), activeModuleStore, BUYING_NAV_GROUPS, DashboardLink(), DEFAULT_STATE, findActiveGroupId(), isItemActive() (+23 more)

### Community 8 - "Relationship Map Components"
Cohesion: 0.15
Nodes (33): MaterialRequestDetailPage(), PurchaseInvoiceDetailPage(), PurchaseOrderDetailPage(), PurchaseReceiptDetailPage(), RfqDetailPage(), SupplierQuotationDetailPage(), DeliveryNoteDetailPage(), SalesInvoiceDetailPage() (+25 more)

### Community 9 - "MCP Server Config & ERPNext Client"
Cohesion: 0.10
Nodes (26): MaterialRequestsPage(), SearchParams, SORT_OPTIONS, STATUS_OPTIONS, PurchaseOrdersPage(), SearchParams, SORT_OPTIONS, STATUS_OPTIONS (+18 more)

### Community 10 - "App Shell & Navigation"
Cohesion: 0.18
Nodes (26): PurchaseReceiptsPage(), SearchParams, SORT_OPTIONS, STATUS_OPTIONS, RequestForQuotationsPage(), SearchParams, SORT_OPTIONS, CampaignRow (+18 more)

### Community 11 - "Sales Dashboard & Charts"
Cohesion: 0.10
Nodes (26): DOCTYPE_ICON, RelationshipMap(), deliveryNoteStatus(), isOverdue(), PURCHASE_INVOICE_STATUS_TONE, QUOTATION_STATUS_TONE, quotationStatus(), SALES_INVOICE_STATUS_TONE (+18 more)

### Community 12 - "Cross-Module Detail Pages"
Cohesion: 0.12
Nodes (25): attachBatchSerialBundles(), BatchSerialAttachInput, buildDeliveryNoteFields(), cancelDeliveryNoteAction(), createDeliveryNoteAction(), createDeliveryNoteFromSalesOrderAction(), FormState, humanizeError() (+17 more)

### Community 13 - "Frontend Build Config"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 14 - "Delivery Note Actions"
Cohesion: 0.13
Nodes (23): cancelPurchaseReceiptAction(), createPurchaseReceiptFromPurchaseOrderAction(), FormState, humanizeError(), PurchaseOrderForReceipt, PurchaseOrderItemForReceipt, submitPurchaseReceiptAction(), cancelRfqAction() (+15 more)

### Community 15 - "RFQ & Campaign Create Flows"
Cohesion: 0.12
Nodes (21): attachBatchSerialBundles(), buildStockEntryFields(), cancelStockEntryAction(), createStockEntryAction(), FormState, humanizeError(), Purpose, PURPOSES (+13 more)

### Community 16 - "Line Items Editor & Pricing"
Cohesion: 0.13
Nodes (16): NewMaterialRequestPage(), CreatePurchaseOrderFromSupplierQuotationPage(), SupplierQuotationForPO, SupplierQuotationItemForPO, NewDeliveryNotePage(), DeliveryNoteForm(), DeliveryNoteFormState, LineRow (+8 more)

### Community 17 - "Purchase Order Actions"
Cohesion: 0.16
Nodes (22): buildInvoiceItem(), buildInvoiceItemFromDeliveryNote(), buildSalesInvoiceFields(), bulkCreateSalesInvoicesFromOrdersAction(), cancelSalesInvoiceAction(), createSalesInvoiceAction(), createSalesInvoiceFromDeliveryNote(), createSalesInvoiceFromDeliveryNoteAction() (+14 more)

### Community 18 - "Sales Invoice from Delivery Note"
Cohesion: 0.16
Nodes (16): SearchParams, ItemWiseSalesRegisterPage(), SearchParams, DOC_TYPES, RANGES, SalesAnalyticsPage(), SearchParams, TREE_TYPES (+8 more)

### Community 19 - "Purchase Invoice Actions"
Cohesion: 0.14
Nodes (16): DeliveryNotesPage(), SearchParams, SORT_OPTIONS, STATUS_OPTIONS, SearchParams, SORT_OPTIONS, STATUS_OPTIONS, SerialNoRow (+8 more)

### Community 20 - "List Pages (Filters & Sort)"
Cohesion: 0.14
Nodes (18): addComment(), deleteDoc(), DocInfoComment, DocInfoLabel, DocInfoVersion, erpnextFetch(), extractErpNextMessage(), getDocInfo() (+10 more)

### Community 21 - "New Document Create Pages"
Cohesion: 0.11
Nodes (20): Smart Factory Module Declaration, Smart Factory Patches Config, Data Flow (MQTT to Frontend), frontend (dashboards, digital twin), Headless Architecture Decision, Layered View (Shop Floor to Analytics), mcp-server (ERPNext API tool wrapper), mes-service (MQTT to OEE calc) (+12 more)

### Community 22 - "Cross-Document Creation Flows"
Cohesion: 0.11
Nodes (20): Applied Dashboard UI Preview, Export-Ledger Color Palette (Sapphire/Tea/Turmeric/Terracotta), Gem-Stack Mark & Lockups, Why 'Ceylon Stack' (Naming Rationale), Ceylon Stack Color Tokens (sapphire/cinnamon/tea/turmeric/terracotta), Ceylon Stack Naming & Positioning Line, Web Favicon/Manifest Integration Snippet, Brand Guide (Visual Usage Guidelines) (+12 more)

### Community 23 - "Work Order Material Transfer"
Cohesion: 0.17
Nodes (16): buildWorkOrderFields(), createWorkOrderAction(), FormState, humanizeError(), toErpDatetime(), matchWarehouse(), round4(), WorkOrderForm() (+8 more)

### Community 24 - "Stock Balance Page"
Cohesion: 0.18
Nodes (16): buildStockEntryFields(), EligibilityDoc, FormState, humanizeError(), parseTransferRows(), saveTransferDraftAction(), submitTransferAction(), TransferRowInput (+8 more)

### Community 25 - "ERP System — apps/frontend README"
Cohesion: 0.20
Nodes (17): buildSalesOrderFields(), bulkCloseSalesOrdersAction(), bulkReopenSalesOrdersAction(), cancelSalesOrderAction(), createSalesOrderAction(), createSalesOrderFromQuotationAction(), FormState, humanizeError() (+9 more)

### Community 26 - "docs — Smart Factory Module Declaration"
Cohesion: 0.16
Nodes (14): NewSalesOrderPage(), CopiedQuotationFields, CopyFromQuotationPanel(), ConfirmedLineRow, ORDER_TYPES, SalesOrderForm(), SalesOrderFormState, CopyableQuotation (+6 more)

### Community 27 - "package — Applied Dashboard UI Preview"
Cohesion: 0.18
Nodes (15): amendQuotationAction(), buildQuotationFields(), cancelQuotationAction(), createQuotationAction(), FormState, humanizeError(), QuotationForAmend, setQuotationAsLostAction() (+7 more)

### Community 28 - "purchase-receipts — actions"
Cohesion: 0.13
Nodes (13): SellingSettingsDoc, DocTab, SellingSettingsFormShell(), SettingsFormState, SettingsFieldGroup(), SettingsFieldSpec, FIELD_LABEL_OVERRIDES, humanizeField() (+5 more)

### Community 29 - "frontend — eslint"
Cohesion: 0.20
Nodes (15): chipWidth(), SalesFlowMap(), SCENE_ORDER, relatedNodes(), SalesFlowNodeDialog(), SelectedFlowNode, FLOW_RECORDS, FLOW_SCENES (+7 more)

### Community 30 - "orders — actions"
Cohesion: 0.18
Nodes (17): ACCESS.md — Server, Repo & Command Reference, Hetzner Cloud Server (ubuntu-4gb-hel1-4), MES/OEE Service App, DevOps Agent, ERP Functional/Implementation Consultant Agent, Phase 0 ERPNext Walkthrough Gate, frappe-dev agent, frontend-dev agent (+9 more)

### Community 31 - "agents — CLAUDE.md (master control entry point)"
Cohesion: 0.12
Nodes (17): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+9 more)

### Community 32 - "lib — CreatePurchaseInvoiceFromPurchaseOrderPage"
Cohesion: 0.16
Nodes (9): getServerSnapshot(), getSnapshot(), listeners, ReportsList(), setStoredView(), subscribe(), ViewMode, REPORT_CATALOG (+1 more)

### Community 33 - "ERP System — Hetzner Cloud infrastructure"
Cohesion: 0.17
Nodes (7): AddressRow, ContactRow, CustomerGroupRow, TerritoryRow, MasterColumn, MasterTable(), slugify()

### Community 34 - "ERP System — Ceylon Services App Overview"
Cohesion: 0.17
Nodes (15): cancelPickListAction(), createDeliveryNoteFromPickListAction(), FormState, humanizeError(), LocationUpdateInput, parseLocationRows(), PickListForDelivery, PickListLocationForDelivery (+7 more)

### Community 35 - "frontend — jspdf-autotable"
Cohesion: 0.19
Nodes (12): batchSerialTotal(), emptyRow, hasPricingRule(), LineItemsEditor(), pricingRuleSummary(), StockBadge(), PricingContext, PricingResolution (+4 more)

### Community 36 - "suppliers — SupplierForm"
Cohesion: 0.14
Nodes (15): Ceylon Services App Overview, mes-service Overview (FastAPI real-time MES/OEE core), Local Dev Notes (pre-pull placeholder history), smart_factory App Overview (Desk theming now, Manufacturing/OEE later), Hetzner Cloud infrastructure, PLAN.md (week-by-week build plan), AGPL vs GPL license rationale (CRM/Helpdesk/Insights), ceylon_services app (+7 more)

### Community 37 - "work-orders — actions"
Cohesion: 0.13
Nodes (15): dependencies, jspdf-autotable, lucide-react, next, react, react-dom, server-only, xlsx (+7 more)

### Community 38 - "customers — CustomerForm"
Cohesion: 0.24
Nodes (8): createCustomerAction(), fieldsFromForm(), FormState, humanizeError(), updateCustomerAction(), CustomerDoc, CUSTOMER_TYPES, CustomerForm()

### Community 39 - "pick-lists — actions"
Cohesion: 0.24
Nodes (8): createSupplierAction(), fieldsFromForm(), FormState, humanizeError(), updateSupplierAction(), SupplierDoc, SUPPLIER_TYPES, SupplierForm()

### Community 40 - "supplier-quotations — actions"
Cohesion: 0.21
Nodes (11): SalesRegisterPage(), formatCurrencyCard(), SalesHomePage(), formatK(), LineChart(), runReport(), getSellingNumberCards(), getThisQuarterRange() (+3 more)

### Community 41 - "addresses — actions"
Cohesion: 0.20
Nodes (15): CLAUDE.md (master control entry point), Agro-Processing Specialist Agent, Apparel & Textile Specialist Agent, Brand/Marketing Designer Agent, code-reviewer agent, Finance & Reporting Agent, product-designer agent, qa-tester agent (+7 more)

### Community 42 - "agents — MES/OEE Service App"
Cohesion: 0.22
Nodes (8): CHECKBOX_KEYS, createAddressAction(), FormState, TEXT_KEYS, updateAddressAction(), validate(), ADDRESS_TYPES, AddressDoc

### Community 43 - "lib — route"
Cohesion: 0.20
Nodes (14): Changelog & Sources, Ceylon Stack Documentation (public product doc page), Ceylon Stack Frontend — Platform (Live), Changelog: Master Data Canonicalization — Business Partner domain (commit a99656d), Changelog: Master Data Canonicalization — Item domain (commit ddfeed4), docs/controls/AGENT_USAGE_POLICY.md, Master Data canonical routes (/master-data/*), Planned: Role-Based Module Access (design-only, deferred past Buying) (+6 more)

### Community 44 - "items — ItemForm"
Cohesion: 0.19
Nodes (9): StockEntryDetailPage(), StockEntryDoc, summarizeBatchSerialEntries(), getSerialBatchBundleEntries(), stockEntryStatus(), base64UrlToBytes(), encoder, getKey() (+1 more)

### Community 45 - "stock-entries — actions"
Cohesion: 0.23
Nodes (9): NewWorkOrderPage(), NewStockEntryPage(), Purpose, PURPOSES, StockEntryForm(), StockEntryFormState, listManufacturableItemOptions(), getStockDefaults() (+1 more)

### Community 46 - "actions — WorkOrderForm"
Cohesion: 0.27
Nodes (6): createItemAction(), FormState, humanizeError(), updateItemAction(), ItemDoc, ItemForm()

### Community 47 - "quotations — actions"
Cohesion: 0.17
Nodes (13): Buying Core Cycle Build, Documentation Alignment Package (2026-09-16), Inventory MVP / Stock Module Build, Manufacturing Frontend Packages 1-5, s_warehouse Serial/Batch Bundle Bug Fix, apps/frontend Sales Module Phases 1-3, QA: Buying Core Cycle Full Live E2E, QA: Inventory (Stock) Module 2026-09-16 (+5 more)

### Community 48 - "actions — CopyFromQuotationPanel"
Cohesion: 0.20
Nodes (7): createContactAction(), FormState, TEXT_KEYS, updateContactAction(), ContactDoc, fields, fields

### Community 49 - "components — PickListLocationsTable"
Cohesion: 0.22
Nodes (6): CHECKBOX_KEYS, createCustomerGroupAction(), FormState, TEXT_KEYS, updateCustomerGroupAction(), CustomerGroupDoc

### Community 50 - "sales-partners — actions"
Cohesion: 0.22
Nodes (6): CHECKBOX_KEYS, createItemGroupAction(), FormState, TEXT_KEYS, updateItemGroupAction(), ItemGroupDoc

### Community 51 - "batches — actions"
Cohesion: 0.22
Nodes (6): CHECKBOX_KEYS, createPriceListAction(), FormState, TEXT_KEYS, updatePriceListAction(), PriceListDoc

### Community 52 - "scripts — CompletedProcess"
Cohesion: 0.22
Nodes (6): CHECKBOX_KEYS, createTerritoryAction(), FormState, TEXT_KEYS, updateTerritoryAction(), TerritoryDoc

### Community 53 - "lib — jspdf"
Cohesion: 0.29
Nodes (6): buildWarehouseFields(), createWarehouseAction(), FormState, humanizeError(), updateWarehouseAction(), WarehouseDoc

### Community 54 - "material-requests — actions"
Cohesion: 0.25
Nodes (8): SearchParams, SimpleReportPage(), PERIOD_OPTIONS, ReportCatalogEntry, SIMPLE_REPORTS, SimpleReportConfig, SimpleReportField, TREND_BASED_ON_OPTIONS

### Community 55 - "components — SellingSettingsFormShell"
Cohesion: 0.24
Nodes (7): NewSalesInvoicePage(), DiscountFields(), ORDER_TYPES, QuotationForm(), QuotationFormState, SalesInvoiceForm(), SalesInvoiceFormState

### Community 56 - "serial-nos — actions"
Cohesion: 0.24
Nodes (8): PickListDoc, PickListLocation, PickListLocationRow, PickListLocationsTable(), EditablePickListLocation, EditorState, PickListPickedQtyEditor(), pickListStatus()

### Community 57 - "frontend — package.json"
Cohesion: 0.24
Nodes (11): frontend Next.js app, Headless Architecture Decision, mcp-server app, mes-service app, smart_factory Frappe app, Brand Rollout Order (Desk -> smart_factory -> frontend -> docs), ADR-001: Use ERPNext/Frappe as initial reference backend, Week 7-8: Mobile-Friendly Frontend + Dashboards (+3 more)

### Community 58 - "[name] — DocLink"
Cohesion: 0.40
Nodes (10): CompletedProcess, bench(), docker_exec(), ensure_frontend_has_app(), ensure_hostname_alias(), main(), preflight_check_apps_on_backend(), Fail fast, before creating anything, if this bench has never had 	`bench get-app (+2 more)

### Community 59 - "actions — BatchSerialPicker"
Cohesion: 0.31
Nodes (8): jspdf, ExportMenu(), csvEscape(), downloadBlob(), exportToCsv(), exportToExcel(), exportToPdf(), jspdf

### Community 60 - "mcp-server — Manufacturing module (apps/frontend)"
Cohesion: 0.36
Nodes (9): buildMaterialRequestFields(), cancelMaterialRequestAction(), createMaterialRequestAction(), FormState, humanizeError(), MaterialRequestItemInput, parseMaterialRequestItems(), submitMaterialRequestAction() (+1 more)

### Community 61 - "create-supplier-quotation — CreateSupplierQuotationForm"
Cohesion: 0.24
Nodes (7): CreateRfqFromMaterialRequestPage(), MaterialRequestForRfq, MaterialRequestItemForRfq, CreateRfqForm(), FormState, ItemForDisplay, SupplierMultiSelect()

### Community 62 - "transfer-materials — actions"
Cohesion: 0.24
Nodes (10): docs/backend/05-manufacturing/material-transfer.md, docs/controls/AI_AGENT_HANDOFF_POLICY.md, CX-MFG-001: unbound Work Order identity in material-transfer server actions, CX-MFG-006: duplicate item_code Work Order rows, needs verification, Ceylon Stack AI Work Log, Claude/Codex dual-agent coordination and package-closure model, Reuse of ERPNext native make_stock_entry for Material Transfer (vs reimplementing outstanding-qty math), Manufacturing Package 5 (Material Transfer for Manufacture) (+2 more)

### Community 63 - "material-requests — MaterialRequestsPage"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 64 - "purchase-orders — PurchaseOrdersPage"
Cohesion: 0.22
Nodes (8): ADVANCE_PAYMENT_STATUS_OPTIONS, BILLING_STATUS_OPTIONS, DELIVERY_STATUS_OPTIONS, SalesOrdersPage(), SearchParams, SORT_OPTIONS, SalesOrderBulkTable(), SalesOrderRow

### Community 65 - "purchase-receipts — PurchaseReceiptsPage"
Cohesion: 0.36
Nodes (8): Manufacturing module (apps/frontend), apps/mcp-server README, Discovery tools (ping, list_doctypes, get_doctype_fields, list_documents), Manufacturing MCP tools (get_manufacturing_overview, get_work_order_detail, list_work_orders, list_job_cards, get_job_card_detail), Two-tier access model (dev tier vs client tier), inventory-procurement agent, mcp-dev agent, Current Mission Priority Lock

### Community 66 - "quotations — QuotationsPage"
Cohesion: 0.29
Nodes (5): BuyingSimpleReportPage(), BUYING_PERIOD_OPTIONS, BUYING_REPORT_CATALOG, BUYING_SIMPLE_REPORTS, BUYING_TREND_BASED_ON_OPTIONS

### Community 67 - "stock-entries — PURPOSE_OPTIONS"
Cohesion: 0.29
Nodes (6): CompanyDoc, CreateSupplierQuotationPage(), RfqForSq, RfqItemForSq, CreateSupplierQuotationForm(), FormState

### Community 68 - "docs — What's Inside ERPNext (Feature Pack)"
Cohesion: 0.25
Nodes (5): JobCardRow, MaterialTransferRow, WorkOrderDoc, WorkOrderItemRow, WorkOrderOperationRow

### Community 69 - "ERP System — ACCESS.md — Server, Repo & Command Reference"
Cohesion: 0.32
Nodes (8): docs/backend/05-manufacturing/work-order.md, Material Transfer for Manufacture feature (Live), Manufacturing & OEE (Smart Factory) (Building), Work Order Create feature (Live), CX-MFG-002: BOM Operation costing/reference mapping incomplete on Work Order create, Manufacturing Package 3 (Work Order Create), BOM Operation → Work Order Operation manual parity mapping (base_hour_rate→hour_rate, bom reference), Manufacturing Packages 2/3/5 Governance-Closure Corrections (CX-MFG-001-006)

### Community 70 - "docker — backend/db/queue/scheduler/websocket services"
Cohesion: 0.25
Nodes (8): Ceylon Stack Frontend — Buying Module (Live), Ceylon Stack Frontend — Inventory / Stock Module (Live), Buying Module – Next Focus, Manufacturing Module – Following Module, Stock Module – Current Focus, CX-MFG-003: Quality Readiness ratio numerator/denominator mismatch, CX-MFG-004: stale Manufacturing status claims in README/release docs, Manufacturing Package 2 (Work Order detail view)

### Community 71 - "lib — route"
Cohesion: 0.25
Nodes (8): Claude Code Subagent Roster (Dev/DevOps/Client-Facing), ceylon_services Frappe App, ERPNext Desk Ceylon Stack Rebrand, Frappe HR as Second Ceylon Stack Product, Headless Architecture Decision, Multi-Tenant FRAPPE_SITE_NAME_HEADER Fix, pwd.yml Frontend/Backend Filesystem Split Gotcha, smart_factory Custom Frappe App

### Community 72 - "components — PurchaseInvoiceForm"
Cohesion: 0.29
Nodes (7): apps/frontend README, Service-account proxy auth model, Buying module (apps/frontend), Ceylon Stack frontend design system, Inventory/Stock module (apps/frontend), Sales module (apps/frontend), Frontend Design Doc Supersedes DESIGN.md for apps/frontend

### Community 73 - "create-invoice — CreateSalesInvoiceFromSalesOrderPage"
Cohesion: 0.29
Nodes (6): PurchaseInvoicesPage(), SearchParams, SORT_OPTIONS, STATUS_OPTIONS, PurchaseInvoiceRow, PurchaseInvoicesTable()

### Community 74 - "app — layout"
Cohesion: 0.29
Nodes (6): DOC_TYPES, PurchaseAnalyticsPage(), RANGES, SearchParams, TREE_TYPES, VALUE_QUANTITY

### Community 75 - "decisions — Architecture Decision Records doc"
Cohesion: 0.29
Nodes (6): SearchParams, SORT_OPTIONS, STATUS_OPTIONS, SupplierQuotationsPage(), SupplierQuotationRow, SupplierQuotationsTable()

### Community 76 - "(app) — HomePage"
Cohesion: 0.29
Nodes (6): PickListsPage(), SearchParams, SORT_OPTIONS, STATUS_OPTIONS, PickListRow, PickListsTable()

### Community 77 - "docs — Industries & Fit (8 Sri Lankan Segments)"
Cohesion: 0.29
Nodes (6): PURPOSE_OPTIONS, SearchParams, SORT_OPTIONS, StockEntriesPage(), StockEntriesTable(), StockEntryRow

### Community 78 - "docs — Discount Logic Comparison"
Cohesion: 0.29
Nodes (7): CLAUDE.md (Current Mission priority lock), API Layer Rules (lib/erpnext.ts), Ceylon Stack Frontend Guide, lib/erpnext.ts, lib/linkOptions.ts, Module Priority Order (Sales→Buying→Stock→Manufacturing→Accounting→Dashboard), Provenance note (Grok-drafted, reconciled against real codebase 2026-09-15)

### Community 79 - "ceylon_services — install"
Cohesion: 0.29
Nodes (7): What's Inside ERPNext (Feature Pack), Ceylon Stack Playbook Overview, HR & Payroll — Frappe HR (Separate App), Before You Rebrand — GPL-3.0 Note, ERPNext Platform Reference Overview, Handoff Note for Separate Developer, Licensing Note (GPL-3.0 hrms vs AGPL-3.0 crm/helpdesk/insights)

### Community 80 - "ceylon_services — provisioning"
Cohesion: 0.47
Nodes (3): columns, CustomerRow, CustomersTable()

### Community 81 - "login — LoginForm"
Cohesion: 0.47
Nodes (3): columns, ItemRow, ItemsTable()

### Community 82 - "controls — Mission Lock Drift Note"
Cohesion: 0.47
Nodes (3): columns, SupplierRow, SuppliersTable()

### Community 83 - "docs — Cancellation & Amendment Logic"
Cohesion: 0.33
Nodes (5): SearchParams, SORT_OPTIONS, StockBalancePage(), StockBalanceRow, StockBalanceTable()

### Community 84 - "docs — Practice Site Setup Steps (bench new-site)"
Cohesion: 0.40
Nodes (6): backend/db/queue/scheduler/websocket services, frontend service (nginx-entrypoint, FRAPPE_SITE_NAME_HEADER), Swarm-mode restart_policy (No-Op under docker compose), Known Open Gaps (Restart Policy, Default Passwords), pwd.yml FRAPPE_SITE_NAME_HEADER Fix (Critical), Operational Scripts (Backup/Deploy/Health Check)

### Community 85 - ".mcp.json"
Cohesion: 0.60
Nodes (4): POST(), verifyErpNextLogin(), bytesToBase64Url(), signSession()

### Community 86 - "ceylon_services — boot"
Cohesion: 0.40
Nodes (3): metadata, plexMono, plexSans

### Community 87 - "ceylon_services — ceylon_services Proprietary License"
Cohesion: 0.60
Nodes (5): Architecture Decision Records doc, ADR-002: Keep canonical model independent from Frappe, ADR-004: Migrate native backend domain-by-domain, ADR-005: Use behavioral compatibility tests before migrating any domain, ADR-006: Do not migrate accounting/stock valuation until verified

### Community 90 - "frontend — eslint.config.mjs"
Cohesion: 0.67
Nodes (3): SearchParams, StockSimpleReportPage(), STOCK_SIMPLE_REPORTS

### Community 91 - "frontend — next.config"
Cohesion: 0.50
Nodes (4): Industries & Fit (8 Sri Lankan Segments), Manufacturing Module Reference, What's Relevant to Ceylon Stack v1, Stock (Inventory) Module Reference

### Community 92 - "frontend — postcss.config.mjs"
Cohesion: 0.50
Nodes (4): Discount Logic Comparison, Native vs Gaps Scoping Decision (Phase 1), Quotation Scenarios (ERPNext vs SAP B1 vs Acumatica vs D365), Sales Order Scenarios (Partial Delivery, Backorder, Blanket Orders)

### Community 99 - "config — __init__"
Cohesion: 0.67
Nodes (3): Mission Lock Drift Note, Current Mission (Sept 2026), Module Sequencing Rules

### Community 100 - "ceylon_services — hooks"
Cohesion: 0.67
Nodes (3): Cancellation & Amendment Logic, Universal Document Flow (Lead to Payment), Returns / Credit Notes Comparison

### Community 101 - "ceylon_services — __init__"
Cohesion: 1.00
Nodes (3): Agent Operating Guide, Agent Usage Policy, Development System Rules

### Community 102 - "ceylon_services — ceylon_services modules.txt (module reg..."
Cohesion: 0.67
Nodes (3): CX-MD-001: missing QA_LOG/release-doc closure for Item-domain package, Master Data Canonicalization, QA: Master Data Canonicalization - Item Domain

### Community 103 - "ceylon_services — ceylon_services patches.txt (migration ..."
Cohesion: 0.67
Nodes (3): Practice Site Setup Steps (bench new-site), What To Test on Practice Site, Why a Second Site, Not a Second Server

## Ambiguous Edges - Review These
- `Ceylon Stack Color Tokens (sapphire/cinnamon/tea/turmeric/terracotta)` → `Industrial-Functional Color Palette (graphite/signal/alert/success)`  [AMBIGUOUS]
  docs/brand/package/ceylon-stack-frontend-design.md · relation: semantically_similar_to
- `Brand Guide (Visual Usage Guidelines)` → `Ceylon Stack Brand Guide (Full Package Doc)`  [AMBIGUOUS]
  docs/brand/package/Ceylon-Stack-Brand-Guide.html · relation: semantically_similar_to

## Knowledge Gaps
- **554 isolated node(s):** `python`, `ceylon_services`, `eslintConfig`, `name`, `version` (+549 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **60 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Ceylon Stack Color Tokens (sapphire/cinnamon/tea/turmeric/terracotta)` and `Industrial-Functional Color Palette (graphite/signal/alert/success)`?**
  _Edge tagged AMBIGUOUS (relation: semantically_similar_to) - confidence is low._
- **What is the exact relationship between `Brand Guide (Visual Usage Guidelines)` and `Ceylon Stack Brand Guide (Full Package Doc)`?**
  _Edge tagged AMBIGUOUS (relation: semantically_similar_to) - confidence is low._
- **Why does `fetchLinkOptions()` connect `MCP Server Config & ERPNext Client` to `Buying Reports Hub`, `Buying & Manufacturing Detail Pages`, `Manufacturing & Delivery List Pages`, `Relationship Map Components`, `App Shell & Navigation`, `Cross-Module Detail Pages`, `Line Items Editor & Pricing`, `Sales Invoice from Delivery Note`, `Purchase Invoice Actions`, `docs — Smart Factory Module Declaration`, `package — Applied Dashboard UI Preview`, `purchase-receipts — actions`, `supplier-quotations — actions`, `stock-entries — actions`, `material-requests — actions`, `components — SellingSettingsFormShell`, `create-supplier-quotation — CreateSupplierQuotationForm`, `purchase-orders — PurchaseOrdersPage`, `quotations — QuotationsPage`, `stock-entries — PURPOSE_OPTIONS`, `create-invoice — CreateSalesInvoiceFromSalesOrderPage`, `app — layout`, `decisions — Architecture Decision Records doc`, `(app) — HomePage`, `docs — Industries & Fit (8 Sri Lankan Segments)`, `docs — Cancellation & Amendment Logic`, `frontend — eslint.config.mjs`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `dependencies` connect `work-orders — actions` to `actions — BatchSerialPicker`, `material-requests — MaterialRequestsPage`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `agents — CLAUDE.md (master control entry point)` to `material-requests — MaterialRequestsPage`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **What connects `python`, `ceylon_services`, `eslintConfig` to the rest of the system?**
  _554 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Buying Reports Hub` be split into smaller, more focused modules?**
  _Cohesion score 0.05898021308980213 - nodes in this community are weakly interconnected._