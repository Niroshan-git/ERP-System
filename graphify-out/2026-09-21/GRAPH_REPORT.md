# Graph Report - D:/_07_ERP/ERP System  (2026-09-20)

## Corpus Check
- 10 files · ~705,885 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1841 nodes · 4316 edges · 191 communities (125 shown, 66 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 59 edges (avg confidence: 0.75)
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
- ceylon_services — __init__
- config — __init__
- ceylon_services — hooks
- ceylon_services — __init__
- ceylon_services — ceylon_services modules.txt (module reg...
- ceylon_services — ceylon_services patches.txt (migration ...
- patches — __init__
- js — ceylon_services_desk.js
- templates — __init__
- mcp-server — mcp-server Python Dependencies (mcp, httpx, ...
- src — __init__
- config — __init__
- smart_factory — hooks
- smart_factory — __init__
- js — ceylon_stack_desk.js
- smart_factory — __init__
- templates — __init__
- pages — __init__
- ERP System — Ceylon Stack Naming & Positioning
- ERP System — Ceylon Stack Color Tokens (sapphire/cinnamon...
- ERP System — Voice & Tone Guidelines
- ERP System — The 'What's Underneath' Answer
- docs — Multi-Client Path (Frappe Multi-Site)
- 05-manufacturing — Manufacturing Documentation Scope (202...
- brand — Ceylon Stack Brand Voice
- package — Frontend Type System (IBM Plex Sans/Mono)
- docs — Extension Points (Building Around ERPNext)
- docs — Licensing (GPL-3.0) — Playbook
- docs — The Offer (Sri Lanka Market Segments)
- docs — Assets/Projects/CRM/Quality/Support/POS/Website Re...
- docs — Platform-Level Capabilities
- Brand Color Tokens
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
- Community 161
- Community 162
- Community 163
- Community 164
- Community 165
- Community 166
- Community 167
- Community 168
- Community 169
- Community 170
- Community 171
- Community 172
- Community 173
- Community 174
- Community 175
- Community 176
- Community 177
- Community 178
- Community 179
- Community 180
- Community 181
- Community 182
- Community 183
- Community 184
- Definition of Done Reference
- Master Data Canonical Routes
- Module Priority Order
- Role-Based Module Access (Planned)
- Sales Module Current State
- Standard Document Pattern

## God Nodes (most connected - your core abstractions)
1. `fetchLinkOptions()` - 99 edges
2. `listDocs()` - 60 edges
3. `ErpNextError` - 57 edges
4. `getDoc()` - 57 edges
5. `getCount()` - 42 edges
6. `parsePage()` - 39 edges
7. `parsePageSize()` - 39 edges
8. `paginate()` - 39 edges
9. `listItemOptions()` - 39 edges
10. `getConnections()` - 37 edges

## Surprising Connections (you probably didn't know these)
- `ERPNext Core & Desk Branding (Live)` --semantically_similar_to--> `smart_factory Frappe App`  [INFERRED] [semantically similar]
  docs/ceylon-stack-documentation.html → PROGRESS.md
- `Product Portfolio & Multi-Tenant Hosting (Live)` --semantically_similar_to--> `ceylon_services Frappe App`  [INFERRED] [semantically similar]
  docs/ceylon-stack-documentation.html → PROGRESS.md
- `Partial Fulfillment & Copy From Quotation (Live)` --semantically_similar_to--> `Sales Module Phases 1-3 Build`  [INFERRED] [semantically similar]
  docs/ceylon-stack-documentation.html → PROGRESS.md
- `Sales Documents (Live)` --semantically_similar_to--> `Sales Module Phases 1-3 Build`  [INFERRED] [semantically similar]
  docs/ceylon-stack-documentation.html → PROGRESS.md
- `Manufacturing Package 4 Investigation (Work Order Material Change)` --semantically_similar_to--> `Production Plan Cancel Investigation (Deferred Feature)`  [INFERRED] [semantically similar]
  QA_LOG.md → docs/backend/05-manufacturing/production-plan.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Master Data Canonicalization Domain Packages (Item, Business Partner, Inventory Structure)** — qa_log_md_item_domain_qa, qa_log_md_business_partner_domain_qa, qa_log_md_inventory_structure_domain_qa, docs_operations_ai_work_log_md_item_domain, docs_operations_ai_work_log_md_business_partner_domain, docs_operations_ai_work_log_md_inventory_structure_domain [INFERRED 0.85]
- **Production Plan Incremental Package Build (PP-1 through PP-6)** — docs_backend_05_manufacturing_production_plan_pp1, docs_backend_05_manufacturing_production_plan_pp2, docs_backend_05_manufacturing_production_plan_pp3, docs_backend_05_manufacturing_production_plan_pp4, docs_backend_05_manufacturing_production_plan_pp5, docs_backend_05_manufacturing_production_plan_pp6 [EXTRACTED 0.95]
- **Dual-Claude Cross-Review Governance Model** — docs_controls_temp_dual_claude_mode_concept, docs_controls_temp_dual_claude_mode_claude_a, docs_controls_temp_dual_claude_mode_claude_b, docs_controls_temp_dual_claude_mode_session_log [EXTRACTED 0.90]
- **Current Mission priority lock sequencing reflected across control and product docs** — claude_document, docs_controls_frontend_guide_module_priority_order, docs_ceylon_stack_documentation_roadmap_manufacturing, docs_ceylon_stack_documentation_frontend_buying, docs_ceylon_stack_documentation_frontend_inventory [INFERRED 0.85]
- **Competing Ceylon Stack Color Token Systems** — docs_brand_md_color_tokens, docs_brand_ceylon_stack_branding_color_palette, docs_brand_package_ceylon_stack_frontend_design_color_palette [INFERRED 0.75]
- **MCP Agent Roster Across Docs** — docs_ceylon_stack_playbook_agent_roster, docs_mcp_agents_plan_phase2_agents, docs_ceylon_stack_documentation_roadmap_agents [INFERRED 0.85]
- **Stock-Entry-driven material deviation pattern** — docs_backend_05_manufacturing_work_order_work_order, docs_backend_05_manufacturing_material_transfer_material_transfer, docs_backend_05_manufacturing_material_transfer_mfg_stk_001, docs_backend_05_manufacturing_work_order_mfg_wf_002 [EXTRACTED 1.00]
- **Backend knowledge capture documentation pipeline** — docs_controls_backend_knowledge_policy_backend_knowledge_policy, docs_backend_00_architecture_readme_canonical_model_layer_stack, docs_backend_15_migration_migration_status_migration_status_table, docs_backend_99_unverified_unverified_behaviours_unverified_behaviours [INFERRED 0.85]
- **Agent governance binding control document system** — docs_controls_agent_operating_guide_agent_operating_guide, docs_controls_agent_usage_policy_agent_usage_policy, docs_controls_development_system_rules_development_system_rules, docs_controls_frontend_guide_frontend_guide [EXTRACTED 1.00]

## Communities (191 total, 66 thin omitted)

### Community 0 - "Buying Reports Hub"
Cohesion: 0.05
Nodes (104): MaterialRequestsPage(), SearchParams, SORT_OPTIONS, STATUS_OPTIONS, PurchaseInvoicesPage(), SearchParams, SORT_OPTIONS, STATUS_OPTIONS (+96 more)

### Community 1 - "Buying & Manufacturing Detail Pages"
Cohesion: 0.06
Nodes (52): createCampaignAction(), FormState, TEXT_KEYS, updateCampaignAction(), CampaignDoc, fields, fields, createSalesPartnerAction() (+44 more)

### Community 2 - "Shared Data Table Components"
Cohesion: 0.06
Nodes (49): DOC_TYPES, PurchaseAnalyticsPage(), RANGES, SearchParams, TREE_TYPES, VALUE_QUANTITY, BuyingSimpleReportPage(), SearchParams (+41 more)

### Community 3 - "Backend Knowledge Docs (Manufacturing/Architecture)"
Cohesion: 0.06
Nodes (56): buildInvoiceItemFromPurchaseOrder(), buildInvoiceItemFromPurchaseReceipt(), buildPurchaseInvoiceFields(), cancelPurchaseInvoiceAction(), createPurchaseInvoiceAction(), createPurchaseInvoiceFromPurchaseOrder(), createPurchaseInvoiceFromPurchaseOrderAction(), createPurchaseInvoiceFromPurchaseReceipt() (+48 more)

### Community 4 - "Sales Master Data Create Pages"
Cohesion: 0.07
Nodes (43): buildProductionPlanFields(), checked(), createProductionPlanAction(), FormState, humanizeError(), submitProductionPlanAction(), emptyDraft(), ProductionPlanCreateForm() (+35 more)

### Community 5 - "Buying List Pages"
Cohesion: 0.08
Nodes (33): Config, load_config(), Configuration loading for the Ceylon Stack ERPNext MCP server., Load and validate required ERPNext connection settings.      Raises RuntimeError, ERPNextClient, ERPNextError, _extract_error(), _json() (+25 more)

### Community 6 - "Manufacturing & Delivery List Pages"
Cohesion: 0.07
Nodes (38): Production Plan Cancel Investigation (Deferred Feature), CX-MFG-PP4-001 — Save-Action Payload Allowlist Fix, CX-MFG-PP-001 — Multiple-BOM Support Correction, CX-MFG-PP-003 — Accounting/Stock Impact Correction, Production Plan DocType, Duplicate Work Order / Material Request Generation Finding, Material Request Generation from Production Plan, Material Requirement Planning (Raw Materials) (+30 more)

### Community 7 - "Master Data Create Actions"
Cohesion: 0.08
Nodes (31): AppLayout(), FullscreenToggle(), activeModuleStore, BUYING_NAV_GROUPS, DashboardLink(), DEFAULT_STATE, findActiveGroupId(), isItemActive() (+23 more)

### Community 8 - "Relationship Map Components"
Cohesion: 0.20
Nodes (21): CreateSupplierQuotationPage(), DeliveryNoteDetailPage(), DeliveryNoteDoc, SalesInvoiceDetailPage(), SalesInvoiceDoc, SalesOrderDetailPage(), SalesOrderDoc, QuotationDetailPage() (+13 more)

### Community 9 - "MCP Server Config & ERPNext Client"
Cohesion: 0.10
Nodes (22): NewMaterialRequestPage(), NewPurchaseInvoicePage(), CompanyDoc, RfqForSq, RfqItemForSq, NewDeliveryNotePage(), CreateSupplierQuotationForm(), FormState (+14 more)

### Community 10 - "App Shell & Navigation"
Cohesion: 0.11
Nodes (23): activateBomAction(), buildBomFields(), checked(), createBomAction(), deactivateBomAction(), FormState, humanizeError(), setBomAvailability() (+15 more)

### Community 11 - "Sales Dashboard & Charts"
Cohesion: 0.11
Nodes (24): formatCurrencyCard(), SalesHomePage(), formatK(), LineChart(), chipWidth(), SalesFlowMap(), SCENE_ORDER, relatedNodes() (+16 more)

### Community 12 - "Cross-Module Detail Pages"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 13 - "Frontend Build Config"
Cohesion: 0.10
Nodes (19): PurchaseOrderForSelection, PurchaseOrderItemForSelection, SalesOrderForSelection, SalesOrderItemForSelection, SalesOrderForSelection, SalesOrderItemForSelection, CreateDeliveryNoteFromPickListPage(), PickListForSelection (+11 more)

### Community 14 - "Delivery Note Actions"
Cohesion: 0.17
Nodes (23): MaterialRequestDetailPage(), PurchaseInvoiceDetailPage(), PurchaseInvoiceDoc, PurchaseOrderDetailPage(), PurchaseOrderDoc, RfqDetailPage(), buildNode(), dedupeRefs() (+15 more)

### Community 15 - "RFQ & Campaign Create Flows"
Cohesion: 0.12
Nodes (19): buildWorkOrderFields(), createWorkOrderAction(), FormState, humanizeError(), toErpDatetime(), NewWorkOrderPage(), NewStockEntryPage(), matchWarehouse() (+11 more)

### Community 16 - "Line Items Editor & Pricing"
Cohesion: 0.13
Nodes (24): CreateSalesInvoiceFromDeliveryNotePage(), DeliveryNoteForSelection, DeliveryNoteItemForSelection, buildInvoiceItem(), buildInvoiceItemFromDeliveryNote(), buildSalesInvoiceFields(), bulkCreateSalesInvoicesFromOrdersAction(), cancelSalesInvoiceAction() (+16 more)

### Community 17 - "Purchase Order Actions"
Cohesion: 0.11
Nodes (20): docstatusLabel(), GeneratedMaterialRequestRow, GeneratedWorkOrderRow, MaterialRequestPlanItemRow, ProductionPlanDetailPage(), ProductionPlanDoc, ProductionPlanItemReferenceRow, ProductionPlanItemRow (+12 more)

### Community 18 - "Sales Invoice from Delivery Note"
Cohesion: 0.13
Nodes (16): SellingSettingsDoc, SellingSettingsPage(), SellingSettingsFormShell(), SettingsFieldGroup(), SettingsFieldSpec, CommentResult, escapeHtml(), postCommentAction() (+8 more)

### Community 19 - "Purchase Invoice Actions"
Cohesion: 0.15
Nodes (22): deliveryNoteStatus(), isOverdue(), PRODUCTION_PLAN_STATUS_TONE, PURCHASE_INVOICE_STATUS_TONE, QUOTATION_STATUS_TONE, quotationStatus(), SALES_INVOICE_STATUS_TONE, salesInvoiceStatus() (+14 more)

### Community 20 - "List Pages (Filters & Sort)"
Cohesion: 0.14
Nodes (16): DiscountFields(), batchSerialTotal(), emptyRow, hasPricingRule(), LineItemsEditor(), pricingRuleSummary(), ORDER_TYPES, QuotationFormState (+8 more)

### Community 21 - "New Document Create Pages"
Cohesion: 0.14
Nodes (20): cancelPickListAction(), createDeliveryNoteFromPickListAction(), createPickListFromSalesOrderAction(), FormState, humanizeError(), LocationUpdateInput, parseLocationRows(), PickListForDelivery (+12 more)

### Community 22 - "Cross-Document Creation Flows"
Cohesion: 0.18
Nodes (17): StockEntryDetailPage(), StockEntryDoc, summarizeBatchSerialEntries(), ActivityTimeline(), formatRelativeTime(), getInitials(), getSerialBatchBundleEntries(), getDocInfo() (+9 more)

### Community 23 - "Work Order Material Transfer"
Cohesion: 0.11
Nodes (20): Smart Factory Module Declaration, Smart Factory Patches Config, Data Flow (MQTT to Frontend), frontend (dashboards, digital twin), Headless Architecture Decision, Layered View (Shop Floor to Analytics), mcp-server (ERPNext API tool wrapper), mes-service (MQTT to OEE calc) (+12 more)

### Community 24 - "Stock Balance Page"
Cohesion: 0.11
Nodes (20): Applied Dashboard UI Preview, Export-Ledger Color Palette (Sapphire/Tea/Turmeric/Terracotta), Gem-Stack Mark & Lockups, Why 'Ceylon Stack' (Naming Rationale), Ceylon Stack Color Tokens (sapphire/cinnamon/tea/turmeric/terracotta), Ceylon Stack Naming & Positioning Line, Web Favicon/Manifest Integration Snippet, Brand Guide (Visual Usage Guidelines) (+12 more)

### Community 25 - "ERP System — apps/frontend README"
Cohesion: 0.18
Nodes (16): buildStockEntryFields(), EligibilityDoc, FormState, humanizeError(), parseTransferRows(), saveTransferDraftAction(), submitTransferAction(), TransferRowInput (+8 more)

### Community 26 - "docs — Smart Factory Module Declaration"
Cohesion: 0.15
Nodes (14): NewSalesInvoicePage(), CreateDeliveryNoteFromSalesOrderPage(), SalesOrderForSelection, SalesOrderItemForSelection, CreatePickListFromSalesOrderPage(), NewSalesOrderPage(), NewQuotationPage(), QuotationForm() (+6 more)

### Community 27 - "package — Applied Dashboard UI Preview"
Cohesion: 0.18
Nodes (16): cancelPurchaseReceiptAction(), createPurchaseReceiptFromPurchaseOrderAction(), FormState, humanizeError(), PurchaseOrderForReceipt, PurchaseOrderItemForReceipt, submitPurchaseReceiptAction(), cancelRfqAction() (+8 more)

### Community 28 - "purchase-receipts — actions"
Cohesion: 0.18
Nodes (15): amendQuotationAction(), buildQuotationFields(), cancelQuotationAction(), createQuotationAction(), FormState, humanizeError(), QuotationForAmend, setQuotationAsLostAction() (+7 more)

### Community 29 - "frontend — eslint"
Cohesion: 0.12
Nodes (17): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+9 more)

### Community 30 - "orders — actions"
Cohesion: 0.21
Nodes (10): MaterialRequestDoc, RfqDoc, DocActionBar(), DocActionState, DocTab, DocTabs(), PlainLineItemRow, PlainLineItemsTable() (+2 more)

### Community 31 - "agents — CLAUDE.md (master control entry point)"
Cohesion: 0.21
Nodes (16): buildSalesOrderFields(), bulkCloseSalesOrdersAction(), bulkReopenSalesOrdersAction(), cancelSalesOrderAction(), createSalesOrderAction(), createSalesOrderFromQuotationAction(), FormState, humanizeError() (+8 more)

### Community 32 - "lib — CreatePurchaseInvoiceFromPurchaseOrderPage"
Cohesion: 0.17
Nodes (13): CopiedQuotationFields, CopyFromQuotationPanel(), ConfirmedLineRow, ORDER_TYPES, SalesOrderForm(), SalesOrderFormState, CopyableQuotation, getQuotationForCopy() (+5 more)

### Community 33 - "ERP System — Hetzner Cloud infrastructure"
Cohesion: 0.13
Nodes (15): dependencies, jspdf-autotable, lucide-react, next, react, react-dom, server-only, xlsx (+7 more)

### Community 34 - "ERP System — Ceylon Services App Overview"
Cohesion: 0.25
Nodes (9): SupplierQuotationDetailPage(), SupplierQuotationDoc, columns, columns, columns, StatusPill(), styles, DocStatus (+1 more)

### Community 35 - "frontend — jspdf-autotable"
Cohesion: 0.24
Nodes (8): createCustomerAction(), fieldsFromForm(), FormState, humanizeError(), updateCustomerAction(), CustomerDoc, CUSTOMER_TYPES, CustomerForm()

### Community 36 - "suppliers — SupplierForm"
Cohesion: 0.24
Nodes (8): createSupplierAction(), fieldsFromForm(), FormState, humanizeError(), updateSupplierAction(), SupplierDoc, SUPPLIER_TYPES, SupplierForm()

### Community 37 - "work-orders — actions"
Cohesion: 0.17
Nodes (11): BatchSerialEntry, BatchSerialPicker(), AutoBatchRow, AutoSerialRow, BatchSerialLedgerEntry, getAutoBatchSerialData(), SerialBatchBundleEntry, MaterialTransferPreviewResult (+3 more)

### Community 38 - "customers — CustomerForm"
Cohesion: 0.15
Nodes (15): MFG-UNV-004 — Job Card Document Lifecycle Unverified, MFG-UNV-009 — BOM Document Lifecycle/Explosion/Costing Recompute, MFG-UNV-010 — BOM Detail Page Status-Tone/Route Walkthrough, MFG-UNV-011 — BOM Create/Edit Non-Draft Rejection/Zero-Rate Acceptance, Ceylon Stack Frontend — Platform (Live), BOM Package 4A Ledger Entry, Master Data Navigation Foundation (MD-1) Package, Master Data Canonicalization — Inventory Structure Domain Ledger Entry (+7 more)

### Community 39 - "pick-lists — actions"
Cohesion: 0.20
Nodes (6): PurchaseReceiptDetailPage(), PurchaseReceiptDoc, MODULE_CARDS, ModuleCard, Breadcrumb(), purchaseReceiptStatus()

### Community 40 - "supplier-quotations — actions"
Cohesion: 0.22
Nodes (8): CHECKBOX_KEYS, createAddressAction(), FormState, TEXT_KEYS, updateAddressAction(), validate(), ADDRESS_TYPES, AddressDoc

### Community 41 - "addresses — actions"
Cohesion: 0.27
Nodes (6): createItemAction(), FormState, humanizeError(), updateItemAction(), ItemDoc, ItemForm()

### Community 42 - "agents — MES/OEE Service App"
Cohesion: 0.28
Nodes (12): attachBatchSerialBundles(), BatchSerialAttachInput, buildDeliveryNoteFields(), cancelDeliveryNoteAction(), createDeliveryNoteAction(), createDeliveryNoteFromSalesOrderAction(), FormState, humanizeError() (+4 more)

### Community 43 - "lib — route"
Cohesion: 0.20
Nodes (7): createContactAction(), FormState, TEXT_KEYS, updateContactAction(), ContactDoc, fields, fields

### Community 44 - "items — ItemForm"
Cohesion: 0.23
Nodes (9): PickListDetailPage(), PickListDoc, PickListLocation, PickListLocationRow, PickListLocationsTable(), EditablePickListLocation, EditorState, PickListPickedQtyEditor() (+1 more)

### Community 45 - "stock-entries — actions"
Cohesion: 0.30
Nodes (11): attachBatchSerialBundles(), buildStockEntryFields(), cancelStockEntryAction(), createStockEntryAction(), FormState, humanizeError(), Purpose, PURPOSES (+3 more)

### Community 46 - "actions — WorkOrderForm"
Cohesion: 0.26
Nodes (11): createLocalStore(), cachedState, defaultVisibleKeys(), EMPTY_STATE, getServerSnapshot(), listeners, readState(), StoredState (+3 more)

### Community 47 - "quotations — actions"
Cohesion: 0.17
Nodes (12): BOM Creator doctype, BOM (Bill of Materials) — Backend Knowledge Baseline, BOM doctype, BOM Frontend Capability (Package 4A), BOM Item (child table), Multi-level / nested BOM, Mutation Contract (BOM Package 4B), BOM Operation (child table) (+4 more)

### Community 48 - "actions — CopyFromQuotationPanel"
Cohesion: 0.22
Nodes (6): CHECKBOX_KEYS, createCustomerGroupAction(), FormState, TEXT_KEYS, updateCustomerGroupAction(), CustomerGroupDoc

### Community 49 - "components — PickListLocationsTable"
Cohesion: 0.22
Nodes (6): CHECKBOX_KEYS, createItemGroupAction(), FormState, TEXT_KEYS, updateItemGroupAction(), ItemGroupDoc

### Community 50 - "sales-partners — actions"
Cohesion: 0.22
Nodes (6): CHECKBOX_KEYS, createPriceListAction(), FormState, TEXT_KEYS, updatePriceListAction(), PriceListDoc

### Community 51 - "batches — actions"
Cohesion: 0.22
Nodes (6): CHECKBOX_KEYS, createTerritoryAction(), FormState, TEXT_KEYS, updateTerritoryAction(), TerritoryDoc

### Community 52 - "scripts — CompletedProcess"
Cohesion: 0.29
Nodes (6): buildWarehouseFields(), createWarehouseAction(), FormState, humanizeError(), updateWarehouseAction(), WarehouseDoc

### Community 53 - "lib — jspdf"
Cohesion: 0.22
Nodes (8): columns, PickListRow, PickListsTable(), ProgressBar(), BulkResult, columns, SalesOrderBulkTable(), SalesOrderRow

### Community 54 - "material-requests — actions"
Cohesion: 0.29
Nodes (7): callAndHumanize(), listSubcontractPurchaseOrderNames(), listWorkOrderNames(), loadSubmittedOrThrow(), makeWorkOrderAction(), MakeWorkOrderResult, SubmittedSnapshot

### Community 55 - "components — SellingSettingsFormShell"
Cohesion: 0.40
Nodes (10): CompletedProcess, bench(), docker_exec(), ensure_frontend_has_app(), ensure_hostname_alias(), main(), preflight_check_apps_on_backend(), Fail fast, before creating anything, if this bench has never had 	`bench get-app (+2 more)

### Community 56 - "serial-nos — actions"
Cohesion: 0.18
Nodes (11): Architecture Decision Records, Canonical Mapping Standard, Canonical Model Layer Stack, FRAPPE_CURRENT_BEHAVIOR tag, FRAPPE_ONLY_IMPLEMENTATION_DETAIL tag, REQUIRED_CEYLON_BEHAVIOR tag, Two Backends, One Product, Ceylon Stack Backend Knowledge Base (+3 more)

### Community 57 - "frontend — package.json"
Cohesion: 0.31
Nodes (8): jspdf, ExportMenu(), csvEscape(), downloadBlob(), exportToCsv(), exportToExcel(), exportToPdf(), jspdf

### Community 58 - "[name] — DocLink"
Cohesion: 0.36
Nodes (9): buildMaterialRequestFields(), cancelMaterialRequestAction(), createMaterialRequestAction(), FormState, humanizeError(), MaterialRequestItemInput, parseMaterialRequestItems(), submitMaterialRequestAction() (+1 more)

### Community 59 - "actions — BatchSerialPicker"
Cohesion: 0.24
Nodes (7): CreateRfqFromMaterialRequestPage(), MaterialRequestForRfq, MaterialRequestItemForRfq, CreateRfqForm(), FormState, ItemForDisplay, SupplierMultiSelect()

### Community 60 - "mcp-server — Manufacturing module (apps/frontend)"
Cohesion: 0.24
Nodes (8): GET_ITEMS_FROM_OPTIONS, SearchParams, SORT_OPTIONS, STATUS_OPTIONS, columns, ProductionPlanRow, ProductionPlansTable(), productionPlanStatus()

### Community 61 - "create-supplier-quotation — CreateSupplierQuotationForm"
Cohesion: 0.24
Nodes (8): JobCardRow, MaterialTransferRow, WorkOrderDetailPage(), WorkOrderDoc, WorkOrderItemRow, WorkOrderOperationRow, canTransferMaterials(), workOrderStatus()

### Community 62 - "transfer-materials — actions"
Cohesion: 0.20
Nodes (10): mes-service Overview (FastAPI real-time MES/OEE core), PLAN.md (week-by-week build plan), Week 11-12+ Stretch Goals, Week 1-2: Foundation (stand up ERPNext), Week 5-6: Real-Time Integration Layer, Week 7-8: Mobile-Friendly Frontend + Dashboards, Week 9-10: Polish, Analytics & Hardening, README.md (repo root) (+2 more)

### Community 63 - "material-requests — MaterialRequestsPage"
Cohesion: 0.31
Nodes (9): ACCESS.md — Server, Repo & Command Reference, Hetzner Cloud Server (ubuntu-4gb-hel1-4), DevOps Agent, Finance & Reporting Agent, Manufacturing Floor Agent, Quality & Compliance Agent, Deploy Smart Factory Skill, Manual Docker cp + Restart Deploy Stopgap (+1 more)

### Community 64 - "purchase-orders — PurchaseOrdersPage"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 65 - "purchase-receipts — PurchaseReceiptsPage"
Cohesion: 0.22
Nodes (9): apps/frontend README, Service-account proxy auth model, Buying module (apps/frontend), Ceylon Stack frontend design system, Inventory/Stock module (apps/frontend), Manufacturing module (apps/frontend), Sales module (apps/frontend), Manufacturing MCP tools (get_manufacturing_overview, get_work_order_detail, list_work_orders, list_job_cards, get_job_card_detail) (+1 more)

### Community 66 - "quotations — QuotationsPage"
Cohesion: 0.33
Nodes (8): cancelSupplierQuotationAction(), createSupplierQuotationFromRfqAction(), FormState, humanizeError(), SourceRfq, SourceRfqItem, submitSupplierQuotationAction(), parseLineRows()

### Community 67 - "stock-entries — PURPOSE_OPTIONS"
Cohesion: 0.28
Nodes (5): CreateAction, DocActionState, DOCTYPE_ICON, RelationshipMap(), RelationshipNode

### Community 68 - "docs — What's Inside ERPNext (Feature Pack)"
Cohesion: 0.22
Nodes (7): DataTable(), columns, PurchaseInvoiceRow, PurchaseInvoicesTable(), columns, PurchaseReceiptRow, PurchaseReceiptsTable()

### Community 69 - "ERP System — ACCESS.md — Server, Repo & Command Reference"
Cohesion: 0.22
Nodes (7): columns, SupplierQuotationRow, SupplierQuotationsTable(), columns, WorkOrderRow, WorkOrdersTable(), ColumnDef

### Community 70 - "docker — backend/db/queue/scheduler/websocket services"
Cohesion: 0.31
Nodes (9): MES/OEE Service App, ERP Functional/Implementation Consultant Agent, Phase 0 ERPNext Walkthrough Gate, frappe-dev agent, frontend-dev agent, MES/IoT Developer Agent, Security Specialist Agent, ERP Inventory Findings (docs/erp-inventory.md) (+1 more)

### Community 71 - "lib — route"
Cohesion: 0.28
Nodes (9): Headless Architecture Decision, Package Closure Rules (Definition of Done), Architecture Decision Records doc, ADR-001: Use ERPNext/Frappe as initial reference backend, ADR-002: Keep canonical model independent from Frappe, ADR-003: Capture backend behavior during frontend development, ADR-004: Migrate native backend domain-by-domain, ADR-005: Use behavioral compatibility tests before migrating any domain (+1 more)

### Community 72 - "components — PurchaseInvoiceForm"
Cohesion: 0.22
Nodes (9): canTransferMaterials() eligibility gate, erpnext.work_order.make_stock_entry, Material Transfer for Manufacture, MFG-STK-001 fg_completed_qty gate, MFG-STK-002 Additional material lifecycle, MFG-STK-003 Quantity headroom, MFG-VAL-004 Warehouse validity server-side, MFG-VAL-005 Batch/serial guard (+1 more)

### Community 73 - "create-invoice — CreateSalesInvoiceFromSalesOrderPage"
Cohesion: 0.33
Nodes (9): MFG-UNV-007 — Work Order Operation Field-Copy Convention, CX-MFG-001 — Material Transfer Trust-Boundary Finding, CX-MFG-002 — Work Order Operations Copy Finding, CX-MFG-003 — Quality Readiness Ratio Finding, CX-MFG-004 — Stale Documentation Finding, Manufacturing Package 2 Ledger Entry (Work Order Detail), Manufacturing Package 3 Ledger Entry (Work Order Create), Manufacturing Package 5 Ledger Entry (Material Transfer) (+1 more)

### Community 74 - "app — layout"
Cohesion: 0.29
Nodes (5): ColumnPicker(), columns, StockEntriesTable(), StockEntryRow, TableId

### Community 75 - "decisions — Architecture Decision Records doc"
Cohesion: 0.29
Nodes (7): Batch & Serial Number Picker (SAP B1-style), Partial Fulfillment & Copy From Quotation (Live), Sales Documents (Live), Real Pricing Rule & Document-Level Discounts, Quotation Lifecycle (Set as Lost, Amend), Sales Module Phases 1-3 Build, Sales Module Combined End-to-End QA (Phase 5)

### Community 76 - "(app) — HomePage"
Cohesion: 0.29
Nodes (7): What's Inside ERPNext (Feature Pack), Ceylon Stack Playbook Overview, HR & Payroll — Frappe HR (Separate App), Before You Rebrand — GPL-3.0 Note, ERPNext Platform Reference Overview, Handoff Note for Separate Developer, Licensing Note (GPL-3.0 hrms vs AGPL-3.0 crm/helpdesk/insights)

### Community 77 - "docs — Industries & Fit (8 Sri Lankan Segments)"
Cohesion: 0.47
Nodes (3): columns, CustomerRow, CustomersTable()

### Community 78 - "docs — Discount Logic Comparison"
Cohesion: 0.47
Nodes (3): columns, ItemRow, ItemsTable()

### Community 79 - "ceylon_services — install"
Cohesion: 0.47
Nodes (3): columns, SupplierRow, SuppliersTable()

### Community 80 - "ceylon_services — provisioning"
Cohesion: 0.40
Nodes (5): ensureDir(), ErrorLogEntry, LOG_DIR, LOG_FILE, logError()

### Community 81 - "login — LoginForm"
Cohesion: 0.47
Nodes (6): apps/mcp-server README, Discovery tools (ping, list_doctypes, get_doctype_fields, list_documents), Two-tier access model (dev tier vs client tier), inventory-procurement agent, mcp-dev agent, qa-tester agent

### Community 82 - "controls — Mission Lock Drift Note"
Cohesion: 0.33
Nodes (6): Job Card (read-only fields), MFG-VAL-006 Quality Readiness rule, ERPNext Inventory Phase 0 Walkthrough, Job Card Naming Series Correction (PO-JOB, not JC-.YYYY.-), Manufacturing Readiness Findings, Risks / Gaps

### Community 83 - "docs — Cancellation & Amendment Logic"
Cohesion: 0.33
Nodes (6): ERPNext Core & Desk Branding (Live), Product Portfolio & Multi-Tenant Hosting (Live), ceylon_services Frappe App, Headless Architecture Decision, Hetzner Cloud Hosting, smart_factory Frappe App

### Community 84 - "docs — Practice Site Setup Steps (bench new-site)"
Cohesion: 0.40
Nodes (6): backend/db/queue/scheduler/websocket services, frontend service (nginx-entrypoint, FRAPPE_SITE_NAME_HEADER), Swarm-mode restart_policy (No-Op under docker compose), Known Open Gaps (Restart Policy, Default Passwords), pwd.yml FRAPPE_SITE_NAME_HEADER Fix (Critical), Operational Scripts (Backup/Deploy/Health Check)

### Community 85 - ".mcp.json"
Cohesion: 0.47
Nodes (6): Buying Core Cycle QA Package, Documentation Alignment Package (2026-09-16), frontend-integration Service Account, Inventory MVP Package (Stock Module), Buying Module Core Cycle QA, Inventory (Stock) Module QA — Inventory MVP

### Community 86 - "ceylon_services — boot"
Cohesion: 0.60
Nodes (4): POST(), verifyErpNextLogin(), bytesToBase64Url(), signSession()

### Community 87 - "ceylon_services — ceylon_services Proprietary License"
Cohesion: 0.40
Nodes (3): SearchParams, SORT_OPTIONS, STATUS_OPTIONS

### Community 88 - "ceylon_services — ceylon_services Pre-commit Hooks Config"
Cohesion: 0.40
Nodes (3): metadata, plexMono, plexSans

### Community 89 - "frontend — Next.js Agent Rules Notice (auto-generated bre..."
Cohesion: 0.40
Nodes (3): BomRow, columns, bomStatus()

### Community 91 - "frontend — next.config"
Cohesion: 0.40
Nodes (5): API Layer Rules (lib/erpnext.ts), Ceylon Stack Frontend Guide, lib/erpnext.ts, lib/linkOptions.ts, Provenance note (Grok-drafted, reconciled against real codebase 2026-09-15)

### Community 92 - "frontend — postcss.config.mjs"
Cohesion: 0.50
Nodes (4): Ceylon Services App Overview, Local Dev Notes (pre-pull placeholder history), smart_factory App Overview (Desk theming now, Manufacturing/OEE later), Week 3-4: Learn & Extend Inside ERPNext

### Community 94 - "brand — Three Type Faces, Three Jobs"
Cohesion: 0.50
Nodes (3): columns, MaterialRequestRow, MaterialRequestsTable()

### Community 95 - "controls — Definition of Ready"
Cohesion: 0.50
Nodes (3): columns, PurchaseOrderRow, PurchaseOrdersTable()

### Community 96 - "scripts — add-nip-io-alias.sh"
Cohesion: 0.50
Nodes (3): columns, RequestForQuotationRow, RequestForQuotationsTable()

### Community 97 - "scripts — sync-app-branch.sh"
Cohesion: 0.50
Nodes (3): columns, StockBalanceRow, StockBalanceTable()

### Community 98 - "ceylon_services — __init__"
Cohesion: 0.50
Nodes (4): Brand/Marketing Designer Agent, product-designer agent, DESIGN.md (Ceylon Stack design system), Brand Reference (docs/brand.md)

### Community 99 - "config — __init__"
Cohesion: 0.50
Nodes (4): Industries & Fit (8 Sri Lankan Segments), Manufacturing Module Reference, What's Relevant to Ceylon Stack v1, Stock (Inventory) Module Reference

### Community 100 - "ceylon_services — hooks"
Cohesion: 0.50
Nodes (4): Discount Logic Comparison, Native vs Gaps Scoping Decision (Phase 1), Quotation Scenarios (ERPNext vs SAP B1 vs Acumatica vs D365), Sales Order Scenarios (Partial Delivery, Backorder, Blanket Orders)

### Community 101 - "ceylon_services — __init__"
Cohesion: 0.67
Nodes (4): AGPL vs GPL license rationale (CRM/Helpdesk/Insights), ceylon_services app, Frappe HR (hrms) product add-on, Product Portfolio plan (2026-09-13)

### Community 108 - "mcp-server — mcp-server Python Dependencies (mcp, httpx, ..."
Cohesion: 0.67
Nodes (3): Cancellation & Amendment Logic, Universal Document Flow (Lead to Payment), Returns / Credit Notes Comparison

### Community 109 - "src — __init__"
Cohesion: 1.00
Nodes (3): Agent Operating Guide, Agent Usage Policy, Development System Rules

### Community 110 - "config — __init__"
Cohesion: 0.67
Nodes (3): Buying Module – Next Focus, Manufacturing Module – Following Module, Stock Module – Current Focus

### Community 111 - "smart_factory — hooks"
Cohesion: 0.67
Nodes (3): Practice Site Setup Steps (bench new-site), What To Test on Practice Site, Why a Second Site, Not a Second Server

## Ambiguous Edges - Review These
- `Ceylon Stack Color Tokens (sapphire/cinnamon/tea/turmeric/terracotta)` → `Industrial-Functional Color Palette (graphite/signal/alert/success)`  [AMBIGUOUS]
  docs/brand/package/ceylon-stack-frontend-design.md · relation: semantically_similar_to
- `Brand Guide (Visual Usage Guidelines)` → `Ceylon Stack Brand Guide (Full Package Doc)`  [AMBIGUOUS]
  docs/brand/package/Ceylon-Stack-Brand-Guide.html · relation: semantically_similar_to

## Knowledge Gaps
- **628 isolated node(s):** `python`, `ceylon_services`, `eslintConfig`, `name`, `version` (+623 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **66 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Ceylon Stack Color Tokens (sapphire/cinnamon/tea/turmeric/terracotta)` and `Industrial-Functional Color Palette (graphite/signal/alert/success)`?**
  _Edge tagged AMBIGUOUS (relation: semantically_similar_to) - confidence is low._
- **What is the exact relationship between `Brand Guide (Visual Usage Guidelines)` and `Ceylon Stack Brand Guide (Full Package Doc)`?**
  _Edge tagged AMBIGUOUS (relation: semantically_similar_to) - confidence is low._
- **Why does `fetchLinkOptions()` connect `Buying Reports Hub` to `Buying & Manufacturing Detail Pages`, `Shared Data Table Components`, `Backend Knowledge Docs (Manufacturing/Architecture)`, `Relationship Map Components`, `MCP Server Config & ERPNext Client`, `Sales Dashboard & Charts`, `Delivery Note Actions`, `RFQ & Campaign Create Flows`, `Sales Invoice from Delivery Note`, `docs — Smart Factory Module Declaration`, `actions — BatchSerialPicker`, `purchase-receipts — actions`, `orders — actions`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `dependencies` connect `ERP System — Hetzner Cloud infrastructure` to `purchase-orders — PurchaseOrdersPage`, `frontend — package.json`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `ErpNextError` connect `orders — actions` to `Buying Reports Hub`, `Buying & Manufacturing Detail Pages`, `Backend Knowledge Docs (Manufacturing/Architecture)`, `Sales Master Data Create Pages`, `Relationship Map Components`, `MCP Server Config & ERPNext Client`, `Frontend Build Config`, `Delivery Note Actions`, `Line Items Editor & Pricing`, `Sales Invoice from Delivery Note`, `New Document Create Pages`, `Cross-Document Creation Flows`, `docs — Smart Factory Module Declaration`, `package — Applied Dashboard UI Preview`, `purchase-receipts — actions`, `agents — CLAUDE.md (master control entry point)`, `ERP System — Ceylon Services App Overview`, `work-orders — actions`, `pick-lists — actions`, `agents — MES/OEE Service App`, `items — ItemForm`, `stock-entries — actions`, `[name] — DocLink`, `actions — BatchSerialPicker`, `mcp-server — Manufacturing module (apps/frontend)`, `quotations — QuotationsPage`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **What connects `python`, `ceylon_services`, `eslintConfig` to the rest of the system?**
  _628 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Buying Reports Hub` be split into smaller, more focused modules?**
  _Cohesion score 0.05247011530730985 - nodes in this community are weakly interconnected._