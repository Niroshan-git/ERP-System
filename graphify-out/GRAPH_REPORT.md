# Graph Report - D:/_07_ERP/ERP System  (2026-09-19)

## Corpus Check
- 8 files · ~648,220 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1701 nodes · 4154 edges · 161 communities (108 shown, 53 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 47 edges (avg confidence: 0.75)
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
- frontend — postcss.config.mjs
- smart_factory — boot
- brand — Three Type Faces, Three Jobs
- controls — Definition of Ready
- scripts — add-nip-io-alias.sh
- ceylon_services — __init__
- config — __init__
- ceylon_services — hooks
- ceylon_services — __init__
- ceylon_services — ceylon_services modules.txt (module reg...
- ceylon_services — ceylon_services patches.txt (migration ...
- js — ceylon_services_desk.js
- templates — __init__
- pages — __init__
- mcp-server — mcp-server Python Dependencies (mcp, httpx, ...
- src — __init__
- js — ceylon_stack_desk.js
- smart_factory — __init__
- ERP System — Mark & Logo Assets (gemstone mark)
- docs — The Offer (Sri Lanka Market Segments)
- docs — Objection Handling Table
- docs — Sales Module Full Scenario Capture
- docs — Accounting Module Reference
- docs — Buying Module Reference
- docs — Assets/Projects/CRM/Quality/Support/POS/Website Re...
- docs — Platform-Level Capabilities
- docs — Selling Module Reference
- ceylon_services
- smart_factory
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
- `Agro-Processing Specialist Agent` --references--> `CLAUDE.md (master control entry point)`  [EXTRACTED]
  .claude/agents/agro-processing.md → CLAUDE.md
- `Apparel & Textile Specialist Agent` --references--> `CLAUDE.md (master control entry point)`  [EXTRACTED]
  .claude/agents/apparel-textile.md → CLAUDE.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **BOM Package 4B closure across PROGRESS/backend-doc/QA/AI_WORK_LOG** — progress_bom_package_4b, docs_backend_05_manufacturing_bom_mutation_contract, qa_log_bom_package_4b_entry, docs_operations_ai_work_log_bom_4b_row [INFERRED 0.85]
- **qa-tester subagent permission-boundary / credential exploration incident** — progress_qa_tester_subagent, progress_mcp_server_env, progress_auto_mode_classifier, progress_security_note_incident [EXTRACTED 1.00]
- **MFG-UNV BOM lifecycle uncertainty lineage (004 -> 009 -> 011)** — docs_backend_99_unverified_unverified_behaviours_mfg_unv_004, docs_backend_99_unverified_unverified_behaviours_mfg_unv_009, docs_backend_99_unverified_unverified_behaviours_mfg_unv_011 [INFERRED 0.85]
- **Manufacturing Backend Knowledge Baseline Document Set** — docs_backend_05_manufacturing_readme_doc, docs_backend_05_manufacturing_work_order_doc, docs_backend_05_manufacturing_material_transfer_doc, docs_backend_05_manufacturing_job_card_doc, docs_backend_05_manufacturing_bom_doc, docs_backend_11_relationships_master_erd_doc [EXTRACTED 1.00]
- **Current Mission priority lock sequencing reflected across control and product docs** — claude_document, docs_controls_frontend_guide_module_priority_order, docs_ceylon_stack_documentation_roadmap_manufacturing, docs_ceylon_stack_documentation_frontend_buying, docs_ceylon_stack_documentation_frontend_inventory [INFERRED 0.85]
- **Competing Ceylon Stack Color Token Systems** — docs_brand_md_color_tokens, docs_brand_ceylon_stack_branding_color_palette, docs_brand_package_ceylon_stack_frontend_design_color_palette [INFERRED 0.75]
- **MCP Agent Roster Across Docs** — docs_ceylon_stack_playbook_agent_roster, docs_mcp_agents_plan_phase2_agents, docs_ceylon_stack_documentation_roadmap_agents [INFERRED 0.85]
- **Package closure / Definition of Done workflow** — claude_package_closure_rules, claude_agents_code_reviewer, claude_agents_qa_tester, claude_agents_release_tracker, qa_log, progress [INFERRED 0.85]
- **Apps implementing the headless architecture split** — claude_headless_architecture, claude_smart_factory_app, claude_frontend_app, claude_mes_service_app, claude_mcp_server_app [INFERRED 0.85]
- **Stock-Entry-driven material deviation pattern** — docs_backend_05_manufacturing_work_order_work_order, docs_backend_05_manufacturing_material_transfer_material_transfer, docs_backend_05_manufacturing_material_transfer_mfg_stk_001, docs_backend_05_manufacturing_work_order_mfg_wf_002 [EXTRACTED 1.00]
- **Backend knowledge capture documentation pipeline** — docs_controls_backend_knowledge_policy_backend_knowledge_policy, docs_backend_00_architecture_readme_canonical_model_layer_stack, docs_backend_15_migration_migration_status_migration_status_table, docs_backend_99_unverified_unverified_behaviours_unverified_behaviours [INFERRED 0.85]
- **Agent governance binding control document system** — docs_controls_agent_operating_guide_agent_operating_guide, docs_controls_agent_usage_policy_agent_usage_policy, docs_controls_development_system_rules_development_system_rules, docs_controls_frontend_guide_frontend_guide [EXTRACTED 1.00]

## Communities (161 total, 53 thin omitted)

### Community 0 - "Buying Reports Hub"
Cohesion: 0.06
Nodes (99): MaterialRequestDetailPage(), MaterialRequestDoc, PurchaseInvoiceDetailPage(), PurchaseInvoiceDoc, PurchaseOrderDetailPage(), PurchaseOrderDoc, CreatePurchaseInvoiceFromPurchaseReceiptPage(), PurchaseReceiptForSelection (+91 more)

### Community 1 - "Buying & Manufacturing Detail Pages"
Cohesion: 0.06
Nodes (90): MaterialRequestsPage(), SearchParams, SORT_OPTIONS, STATUS_OPTIONS, PurchaseInvoicesPage(), SearchParams, SORT_OPTIONS, STATUS_OPTIONS (+82 more)

### Community 2 - "Shared Data Table Components"
Cohesion: 0.06
Nodes (52): createCampaignAction(), FormState, TEXT_KEYS, updateCampaignAction(), CampaignDoc, fields, fields, createSalesPartnerAction() (+44 more)

### Community 3 - "Backend Knowledge Docs (Manufacturing/Architecture)"
Cohesion: 0.08
Nodes (41): buildInvoiceItemFromPurchaseOrder(), buildInvoiceItemFromPurchaseReceipt(), buildPurchaseInvoiceFields(), cancelPurchaseInvoiceAction(), createPurchaseInvoiceAction(), createPurchaseInvoiceFromPurchaseOrder(), createPurchaseInvoiceFromPurchaseOrderAction(), createPurchaseInvoiceFromPurchaseReceipt() (+33 more)

### Community 4 - "Sales Master Data Create Pages"
Cohesion: 0.08
Nodes (33): Config, load_config(), Configuration loading for the Ceylon Stack ERPNext MCP server., Load and validate required ERPNext connection settings.      Raises RuntimeError, ERPNextClient, ERPNextError, _extract_error(), _json() (+25 more)

### Community 5 - "Buying List Pages"
Cohesion: 0.10
Nodes (32): DOC_TYPES, PurchaseAnalyticsPage(), RANGES, SearchParams, TREE_TYPES, VALUE_QUANTITY, BuyingSimpleReportPage(), SearchParams (+24 more)

### Community 6 - "Manufacturing & Delivery List Pages"
Cohesion: 0.08
Nodes (29): DataTable(), columns, DeliveryNoteRow, DeliveryNotesTable(), columns, MaterialRequestRow, MaterialRequestsTable(), columns (+21 more)

### Community 7 - "Master Data Create Actions"
Cohesion: 0.08
Nodes (36): CreateSalesInvoiceFromDeliveryNotePage(), DeliveryNoteForSelection, DeliveryNoteItemForSelection, buildInvoiceItem(), buildInvoiceItemFromDeliveryNote(), buildSalesInvoiceFields(), bulkCreateSalesInvoicesFromOrdersAction(), cancelSalesInvoiceAction() (+28 more)

### Community 8 - "Relationship Map Components"
Cohesion: 0.08
Nodes (31): AppLayout(), FullscreenToggle(), activeModuleStore, BUYING_NAV_GROUPS, DashboardLink(), DEFAULT_STATE, findActiveGroupId(), isItemActive() (+23 more)

### Community 9 - "MCP Server Config & ERPNext Client"
Cohesion: 0.11
Nodes (23): activateBomAction(), buildBomFields(), checked(), createBomAction(), deactivateBomAction(), FormState, humanizeError(), setBomAvailability() (+15 more)

### Community 10 - "App Shell & Navigation"
Cohesion: 0.11
Nodes (17): getServerSnapshot(), getSnapshot(), listeners, ReportsList(), setStoredView(), subscribe(), ViewMode, BUYING_PERIOD_OPTIONS (+9 more)

### Community 11 - "Sales Dashboard & Charts"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 12 - "Cross-Module Detail Pages"
Cohesion: 0.12
Nodes (21): NewMaterialRequestPage(), CreateSupplierQuotationForm(), FormState, batchSerialTotal(), emptyRow, hasPricingRule(), LineItemsEditor(), LineRow (+13 more)

### Community 13 - "Frontend Build Config"
Cohesion: 0.13
Nodes (23): cancelPurchaseReceiptAction(), createPurchaseReceiptFromPurchaseOrderAction(), FormState, humanizeError(), PurchaseOrderForReceipt, PurchaseOrderItemForReceipt, submitPurchaseReceiptAction(), cancelRfqAction() (+15 more)

### Community 14 - "Delivery Note Actions"
Cohesion: 0.12
Nodes (19): buildWorkOrderFields(), createWorkOrderAction(), FormState, humanizeError(), toErpDatetime(), NewWorkOrderPage(), NewStockEntryPage(), matchWarehouse() (+11 more)

### Community 15 - "RFQ & Campaign Create Flows"
Cohesion: 0.11
Nodes (22): MaterialTransferPreviewResult, TransferMaterialPreview, TransferMaterialRow, addComment(), callMethodWithResult(), deleteDoc(), DocInfoComment, DocInfoLabel (+14 more)

### Community 16 - "Line Items Editor & Pricing"
Cohesion: 0.13
Nodes (20): ColumnPicker(), columns, PurchaseOrderRow, PurchaseOrdersTable(), createLocalStore(), columns, SupplierQuotationRow, SupplierQuotationsTable() (+12 more)

### Community 17 - "Purchase Order Actions"
Cohesion: 0.12
Nodes (16): PurchaseOrderForSelection, PurchaseOrderItemForSelection, CreateDeliveryNoteFromPickListPage(), PickListForSelection, PickListLocationForSelection, SalesOrderRateLookup, QuotationForSelection, QuotationItemForSelection (+8 more)

### Community 18 - "Sales Invoice from Delivery Note"
Cohesion: 0.13
Nodes (17): NewDeliveryNotePage(), CreateDeliveryNoteFromSalesOrderPage(), SalesOrderForSelection, SalesOrderItemForSelection, CreatePickListFromSalesOrderPage(), SalesOrderForSelection, SalesOrderItemForSelection, createPickListFromSalesOrderAction() (+9 more)

### Community 19 - "Purchase Invoice Actions"
Cohesion: 0.16
Nodes (21): deliveryNoteStatus(), isOverdue(), PURCHASE_INVOICE_STATUS_TONE, QUOTATION_STATUS_TONE, quotationStatus(), SALES_INVOICE_STATUS_TONE, salesInvoiceStatus(), salesOrderStatus() (+13 more)

### Community 20 - "List Pages (Filters & Sort)"
Cohesion: 0.11
Nodes (20): Smart Factory Module Declaration, Smart Factory Patches Config, Data Flow (MQTT to Frontend), frontend (dashboards, digital twin), Headless Architecture Decision, Layered View (Shop Floor to Analytics), mcp-server (ERPNext API tool wrapper), mes-service (MQTT to OEE calc) (+12 more)

### Community 21 - "New Document Create Pages"
Cohesion: 0.11
Nodes (20): Applied Dashboard UI Preview, Export-Ledger Color Palette (Sapphire/Tea/Turmeric/Terracotta), Gem-Stack Mark & Lockups, Why 'Ceylon Stack' (Naming Rationale), Ceylon Stack Color Tokens (sapphire/cinnamon/tea/turmeric/terracotta), Ceylon Stack Naming & Positioning Line, Web Favicon/Manifest Integration Snippet, Brand Guide (Visual Usage Guidelines) (+12 more)

### Community 22 - "Cross-Document Creation Flows"
Cohesion: 0.18
Nodes (16): buildStockEntryFields(), EligibilityDoc, FormState, humanizeError(), parseTransferRows(), saveTransferDraftAction(), submitTransferAction(), TransferRowInput (+8 more)

### Community 23 - "Work Order Material Transfer"
Cohesion: 0.20
Nodes (17): buildSalesOrderFields(), bulkCloseSalesOrdersAction(), bulkReopenSalesOrdersAction(), cancelSalesOrderAction(), createSalesOrderAction(), createSalesOrderFromQuotationAction(), FormState, humanizeError() (+9 more)

### Community 24 - "Stock Balance Page"
Cohesion: 0.20
Nodes (15): chipWidth(), SalesFlowMap(), SCENE_ORDER, relatedNodes(), SalesFlowNodeDialog(), SelectedFlowNode, FLOW_RECORDS, FLOW_SCENES (+7 more)

### Community 25 - "ERP System — apps/frontend README"
Cohesion: 0.18
Nodes (17): ACCESS.md — Server, Repo & Command Reference, Hetzner Cloud Server (ubuntu-4gb-hel1-4), MES/OEE Service App, DevOps Agent, ERP Functional/Implementation Consultant Agent, Phase 0 ERPNext Walkthrough Gate, frappe-dev agent, frontend-dev agent (+9 more)

### Community 26 - "docs — Smart Factory Module Declaration"
Cohesion: 0.12
Nodes (17): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+9 more)

### Community 27 - "package — Applied Dashboard UI Preview"
Cohesion: 0.17
Nodes (13): NewSalesOrderPage(), CopiedQuotationFields, CopyFromQuotationPanel(), ORDER_TYPES, SalesOrderForm(), SalesOrderFormState, CopyableQuotation, getQuotationForCopy() (+5 more)

### Community 28 - "purchase-receipts — actions"
Cohesion: 0.21
Nodes (15): attachBatchSerialBundles(), buildStockEntryFields(), cancelStockEntryAction(), createStockEntryAction(), FormState, humanizeError(), Purpose, PURPOSES (+7 more)

### Community 29 - "frontend — eslint"
Cohesion: 0.14
Nodes (15): Ceylon Services App Overview, mes-service Overview (FastAPI real-time MES/OEE core), Local Dev Notes (pre-pull placeholder history), smart_factory App Overview (Desk theming now, Manufacturing/OEE later), Hetzner Cloud infrastructure, PLAN.md (week-by-week build plan), AGPL vs GPL license rationale (CRM/Helpdesk/Insights), ceylon_services app (+7 more)

### Community 30 - "orders — actions"
Cohesion: 0.13
Nodes (15): dependencies, jspdf-autotable, lucide-react, next, react, react-dom, server-only, xlsx (+7 more)

### Community 31 - "agents — CLAUDE.md (master control entry point)"
Cohesion: 0.24
Nodes (8): createCustomerAction(), fieldsFromForm(), FormState, humanizeError(), updateCustomerAction(), CustomerDoc, CUSTOMER_TYPES, CustomerForm()

### Community 32 - "lib — CreatePurchaseInvoiceFromPurchaseOrderPage"
Cohesion: 0.24
Nodes (8): createSupplierAction(), fieldsFromForm(), FormState, humanizeError(), updateSupplierAction(), SupplierDoc, SUPPLIER_TYPES, SupplierForm()

### Community 33 - "ERP System — Hetzner Cloud infrastructure"
Cohesion: 0.27
Nodes (14): buildNode(), dedupeRefs(), DocRef, findRoots(), getChildren(), HREF_BASE, keyOf(), loadNodeData() (+6 more)

### Community 34 - "ERP System — Ceylon Services App Overview"
Cohesion: 0.20
Nodes (15): CLAUDE.md (master control entry point), Agro-Processing Specialist Agent, Apparel & Textile Specialist Agent, Brand/Marketing Designer Agent, code-reviewer agent, Finance & Reporting Agent, product-designer agent, qa-tester agent (+7 more)

### Community 35 - "frontend — jspdf-autotable"
Cohesion: 0.16
Nodes (11): JobCardRow, MaterialTransferRow, WorkOrderDetailPage(), WorkOrderDoc, WorkOrderItemRow, WorkOrderOperationRow, columns, WorkOrderRow (+3 more)

### Community 36 - "suppliers — SupplierForm"
Cohesion: 0.22
Nodes (8): CHECKBOX_KEYS, createAddressAction(), FormState, TEXT_KEYS, updateAddressAction(), validate(), ADDRESS_TYPES, AddressDoc

### Community 37 - "work-orders — actions"
Cohesion: 0.26
Nodes (13): attachBatchSerialBundles(), BatchSerialAttachInput, buildDeliveryNoteFields(), createDeliveryNoteAction(), createDeliveryNoteFromSalesOrderAction(), FormState, humanizeError(), SalesOrderForDelivery (+5 more)

### Community 38 - "customers — CustomerForm"
Cohesion: 0.19
Nodes (13): cancelPickListAction(), FormState, humanizeError(), LocationUpdateInput, parseLocationRows(), PickListForDelivery, PickListLocationForDelivery, PickListLocationInput (+5 more)

### Community 39 - "pick-lists — actions"
Cohesion: 0.27
Nodes (6): createItemAction(), FormState, humanizeError(), updateItemAction(), ItemDoc, ItemForm()

### Community 40 - "supplier-quotations — actions"
Cohesion: 0.24
Nodes (9): formatCurrencyCard(), SalesHomePage(), formatK(), LineChart(), getSellingNumberCards(), getThisQuarterRange(), SELLING_WORKSPACE_CARDS, WorkspaceCard (+1 more)

### Community 41 - "addresses — actions"
Cohesion: 0.17
Nodes (13): Job Card (read-only fields), MFG-VAL-006 Quality Readiness rule, MFG-UNV-004a operations table stays empty on REST insert, MFG-VAL-001 Production Item create restriction, MFG-VAL-003 Draft-stage required_qty reversion, MFG-WF-001 Create-only lifecycle in this frontend, Work Order, Work Order Operation (operations) (+5 more)

### Community 42 - "agents — MES/OEE Service App"
Cohesion: 0.18
Nodes (13): canTransferMaterials() eligibility gate, erpnext.work_order.make_stock_entry, Material Transfer for Manufacture, MFG-STK-001 fg_completed_qty gate, MFG-STK-002 Additional material lifecycle, MFG-STK-003 Quantity headroom, MFG-VAL-004 Warehouse validity server-side, MFG-VAL-005 Batch/serial guard (+5 more)

### Community 43 - "lib — route"
Cohesion: 0.18
Nodes (13): BOM Package 4A: Read-only BOM Entity Frontend, BOM Package 4B: Create + Draft-only Edit, BomComponentsEditor.tsx, BomForm.tsx, BomOperationsEditor.tsx, lib/bomRows.ts, master-data/boms/actions.ts, BOM Package 4B Scope-Sizing Decision (Draft-only convention) (+5 more)

### Community 44 - "items — ItemForm"
Cohesion: 0.20
Nodes (7): createContactAction(), FormState, TEXT_KEYS, updateContactAction(), ContactDoc, fields, fields

### Community 45 - "stock-entries — actions"
Cohesion: 0.30
Nodes (11): amendQuotationAction(), buildQuotationFields(), cancelQuotationAction(), createQuotationAction(), FormState, humanizeError(), QuotationForAmend, setQuotationAsLostAction() (+3 more)

### Community 46 - "actions — WorkOrderForm"
Cohesion: 0.20
Nodes (9): columns, PickListRow, PickListsTable(), ProgressBar(), BulkResult, columns, SalesOrderBulkTable(), SalesOrderRow (+1 more)

### Community 47 - "quotations — actions"
Cohesion: 0.22
Nodes (6): CHECKBOX_KEYS, createCustomerGroupAction(), FormState, TEXT_KEYS, updateCustomerGroupAction(), CustomerGroupDoc

### Community 48 - "actions — CopyFromQuotationPanel"
Cohesion: 0.22
Nodes (6): CHECKBOX_KEYS, createItemGroupAction(), FormState, TEXT_KEYS, updateItemGroupAction(), ItemGroupDoc

### Community 49 - "components — PickListLocationsTable"
Cohesion: 0.22
Nodes (6): CHECKBOX_KEYS, createPriceListAction(), FormState, TEXT_KEYS, updatePriceListAction(), PriceListDoc

### Community 50 - "sales-partners — actions"
Cohesion: 0.22
Nodes (6): CHECKBOX_KEYS, createTerritoryAction(), FormState, TEXT_KEYS, updateTerritoryAction(), TerritoryDoc

### Community 51 - "batches — actions"
Cohesion: 0.29
Nodes (6): buildWarehouseFields(), createWarehouseAction(), FormState, humanizeError(), updateWarehouseAction(), WarehouseDoc

### Community 52 - "scripts — CompletedProcess"
Cohesion: 0.24
Nodes (11): frontend Next.js app, Headless Architecture Decision, mcp-server app, mes-service app, smart_factory Frappe app, Brand Rollout Order (Desk -> smart_factory -> frontend -> docs), ADR-001: Use ERPNext/Frappe as initial reference backend, Week 7-8: Mobile-Friendly Frontend + Dashboards (+3 more)

### Community 53 - "lib — jspdf"
Cohesion: 0.40
Nodes (10): CompletedProcess, bench(), docker_exec(), ensure_frontend_has_app(), ensure_hostname_alias(), main(), preflight_check_apps_on_backend(), Fail fast, before creating anything, if this bench has never had 	`bench get-app (+2 more)

### Community 54 - "material-requests — actions"
Cohesion: 0.18
Nodes (11): Architecture Decision Records, Canonical Mapping Standard, Canonical Model Layer Stack, FRAPPE_CURRENT_BEHAVIOR tag, FRAPPE_ONLY_IMPLEMENTATION_DETAIL tag, REQUIRED_CEYLON_BEHAVIOR tag, Two Backends, One Product, Ceylon Stack Backend Knowledge Base (+3 more)

### Community 55 - "components — SellingSettingsFormShell"
Cohesion: 0.24
Nodes (11): BOM Creator doctype, BOM (Bill of Materials) — Backend Knowledge Baseline, BOM Frontend Capability (Package 4A), Multi-level / nested BOM, Production Plan doctype, BOM domain migration status row, Migration Status, Unverified Behaviours (+3 more)

### Community 56 - "serial-nos — actions"
Cohesion: 0.31
Nodes (8): jspdf, ExportMenu(), csvEscape(), downloadBlob(), exportToCsv(), exportToExcel(), exportToPdf(), jspdf

### Community 57 - "frontend — package.json"
Cohesion: 0.36
Nodes (9): buildMaterialRequestFields(), cancelMaterialRequestAction(), createMaterialRequestAction(), FormState, humanizeError(), MaterialRequestItemInput, parseMaterialRequestItems(), submitMaterialRequestAction() (+1 more)

### Community 58 - "[name] — DocLink"
Cohesion: 0.24
Nodes (7): CreateRfqFromMaterialRequestPage(), MaterialRequestForRfq, MaterialRequestItemForRfq, CreateRfqForm(), FormState, ItemForDisplay, SupplierMultiSelect()

### Community 59 - "actions — BatchSerialPicker"
Cohesion: 0.27
Nodes (6): NewSalesInvoicePage(), DiscountFields(), ORDER_TYPES, QuotationFormState, SalesInvoiceForm(), SalesInvoiceFormState

### Community 60 - "mcp-server — Manufacturing module (apps/frontend)"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 61 - "create-supplier-quotation — CreateSupplierQuotationForm"
Cohesion: 0.33
Nodes (7): BatchSerialEntry, BatchSerialPicker(), AutoBatchRow, AutoSerialRow, BatchSerialLedgerEntry, getAutoBatchSerialData(), SerialBatchBundleEntry

### Community 62 - "transfer-materials — actions"
Cohesion: 0.22
Nodes (6): columns, PurchaseReceiptRow, PurchaseReceiptsTable(), columns, StockBalanceRow, StockBalanceTable()

### Community 63 - "material-requests — MaterialRequestsPage"
Cohesion: 0.36
Nodes (8): Manufacturing module (apps/frontend), apps/mcp-server README, Discovery tools (ping, list_doctypes, get_doctype_fields, list_documents), Manufacturing MCP tools (get_manufacturing_overview, get_work_order_detail, list_work_orders, list_job_cards, get_job_card_detail), Two-tier access model (dev tier vs client tier), inventory-procurement agent, mcp-dev agent, Current Mission Priority Lock

### Community 64 - "purchase-orders — PurchaseOrdersPage"
Cohesion: 0.29
Nodes (8): BOM doctype, BOM Item (child table), Mutation Contract (BOM Package 4B), BOM Operation (child table), Operation doctype, Routing doctype, Workstation doctype, MFG-UNV-011: BOM create/edit non-Draft rejection & zero-rate acceptance

### Community 65 - "purchase-receipts — PurchaseReceiptsPage"
Cohesion: 0.29
Nodes (7): apps/frontend README, Service-account proxy auth model, Buying module (apps/frontend), Ceylon Stack frontend design system, Inventory/Stock module (apps/frontend), Sales module (apps/frontend), Frontend Design Doc Supersedes DESIGN.md for apps/frontend

### Community 66 - "quotations — QuotationsPage"
Cohesion: 0.29
Nodes (7): What's Inside ERPNext (Feature Pack), Ceylon Stack Playbook Overview, HR & Payroll — Frappe HR (Separate App), Before You Rebrand — GPL-3.0 Note, ERPNext Platform Reference Overview, Handoff Note for Separate Developer, Licensing Note (GPL-3.0 hrms vs AGPL-3.0 crm/helpdesk/insights)

### Community 67 - "stock-entries — PURPOSE_OPTIONS"
Cohesion: 0.47
Nodes (3): columns, CustomerRow, CustomersTable()

### Community 68 - "docs — What's Inside ERPNext (Feature Pack)"
Cohesion: 0.47
Nodes (3): columns, ItemRow, ItemsTable()

### Community 69 - "ERP System — ACCESS.md — Server, Repo & Command Reference"
Cohesion: 0.47
Nodes (3): columns, SupplierRow, SuppliersTable()

### Community 70 - "docker — backend/db/queue/scheduler/websocket services"
Cohesion: 0.53
Nodes (6): Master ERD, BOM (ERD entity), JOB_CARD (ERD entity), PRODUCTION_PLAN (ERD entity), STOCK_ENTRY (ERD entity), WORK_ORDER (ERD entity)

### Community 71 - "lib — route"
Cohesion: 0.40
Nodes (6): BOM Package 4A ledger row, Codex (independent review agent), Ceylon Stack AI Work Log, Claude Code ↔ Codex Dual-Agent Coordination Model, Package Ledger, Status Vocabulary (CLAUDE_HANDOFF, CODEX_REVIEW, etc.)

### Community 72 - "components — PurchaseInvoiceForm"
Cohesion: 0.40
Nodes (6): backend/db/queue/scheduler/websocket services, frontend service (nginx-entrypoint, FRAPPE_SITE_NAME_HEADER), Swarm-mode restart_policy (No-Op under docker compose), Known Open Gaps (Restart Policy, Default Passwords), pwd.yml FRAPPE_SITE_NAME_HEADER Fix (Critical), Operational Scripts (Backup/Deploy/Health Check)

### Community 73 - "create-invoice — CreateSalesInvoiceFromSalesOrderPage"
Cohesion: 0.33
Nodes (6): Auto mode Credential Exploration classifier, apps/mcp-server/src/erpnext_client.py, apps/mcp-server/src/config.py, apps/mcp-server/.env, qa-tester subagent (Package 4B), Subagent permission-boundary security incident (qa-tester)

### Community 74 - "app — layout"
Cohesion: 0.60
Nodes (4): POST(), verifyErpNextLogin(), bytesToBase64Url(), signSession()

### Community 75 - "decisions — Architecture Decision Records doc"
Cohesion: 0.50
Nodes (3): NewPurchaseInvoicePage(), PurchaseInvoiceForm(), PurchaseInvoiceFormState

### Community 76 - "(app) — HomePage"
Cohesion: 0.40
Nodes (3): SearchParams, SORT_OPTIONS, STATUS_OPTIONS

### Community 77 - "docs — Industries & Fit (8 Sri Lankan Segments)"
Cohesion: 0.40
Nodes (3): metadata, plexMono, plexSans

### Community 78 - "docs — Discount Logic Comparison"
Cohesion: 0.40
Nodes (3): BomRow, columns, bomStatus()

### Community 79 - "ceylon_services — install"
Cohesion: 0.60
Nodes (3): StockBadge(), BinQty, getBinQty()

### Community 81 - "login — LoginForm"
Cohesion: 0.60
Nodes (5): Architecture Decision Records doc, ADR-002: Keep canonical model independent from Frappe, ADR-004: Migrate native backend domain-by-domain, ADR-005: Use behavioral compatibility tests before migrating any domain, ADR-006: Do not migrate accounting/stock valuation until verified

### Community 82 - "controls — Mission Lock Drift Note"
Cohesion: 0.40
Nodes (5): API Layer Rules (lib/erpnext.ts), Ceylon Stack Frontend Guide, lib/erpnext.ts, lib/linkOptions.ts, Provenance note (Grok-drafted, reconciled against real codebase 2026-09-15)

### Community 84 - "docs — Practice Site Setup Steps (bench new-site)"
Cohesion: 0.50
Nodes (4): Industries & Fit (8 Sri Lankan Segments), Manufacturing Module Reference, What's Relevant to Ceylon Stack v1, Stock (Inventory) Module Reference

### Community 85 - ".mcp.json"
Cohesion: 0.50
Nodes (4): Discount Logic Comparison, Native vs Gaps Scoping Decision (Phase 1), Quotation Scenarios (ERPNext vs SAP B1 vs Acumatica vs D365), Sales Order Scenarios (Partial Delivery, Backorder, Blanket Orders)

### Community 92 - "frontend — postcss.config.mjs"
Cohesion: 0.67
Nodes (3): Cancellation & Amendment Logic, Universal Document Flow (Lead to Payment), Returns / Credit Notes Comparison

### Community 93 - "smart_factory — boot"
Cohesion: 1.00
Nodes (3): Agent Operating Guide, Agent Usage Policy, Development System Rules

### Community 94 - "brand — Three Type Faces, Three Jobs"
Cohesion: 0.67
Nodes (3): Buying Module – Next Focus, Manufacturing Module – Following Module, Stock Module – Current Focus

### Community 95 - "controls — Definition of Ready"
Cohesion: 0.67
Nodes (3): Practice Site Setup Steps (bench new-site), What To Test on Practice Site, Why a Second Site, Not a Second Server

## Ambiguous Edges - Review These
- `Ceylon Stack Color Tokens (sapphire/cinnamon/tea/turmeric/terracotta)` → `Industrial-Functional Color Palette (graphite/signal/alert/success)`  [AMBIGUOUS]
  docs/brand/package/ceylon-stack-frontend-design.md · relation: semantically_similar_to
- `Brand Guide (Visual Usage Guidelines)` → `Ceylon Stack Brand Guide (Full Package Doc)`  [AMBIGUOUS]
  docs/brand/package/Ceylon-Stack-Brand-Guide.html · relation: semantically_similar_to

## Knowledge Gaps
- **558 isolated node(s):** `python`, `ceylon_services`, `eslintConfig`, `name`, `version` (+553 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **53 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Ceylon Stack Color Tokens (sapphire/cinnamon/tea/turmeric/terracotta)` and `Industrial-Functional Color Palette (graphite/signal/alert/success)`?**
  _Edge tagged AMBIGUOUS (relation: semantically_similar_to) - confidence is low._
- **What is the exact relationship between `Brand Guide (Visual Usage Guidelines)` and `Ceylon Stack Brand Guide (Full Package Doc)`?**
  _Edge tagged AMBIGUOUS (relation: semantically_similar_to) - confidence is low._
- **Why does `fetchLinkOptions()` connect `Buying & Manufacturing Detail Pages` to `Buying Reports Hub`, `Shared Data Table Components`, `Backend Knowledge Docs (Manufacturing/Architecture)`, `Buying List Pages`, `package — Applied Dashboard UI Preview`, `supplier-quotations — actions`, `decisions — Architecture Decision Records doc`, `Cross-Module Detail Pages`, `Delivery Note Actions`, `Sales Invoice from Delivery Note`, `[name] — DocLink`, `actions — BatchSerialPicker`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `dependencies` connect `orders — actions` to `serial-nos — actions`, `mcp-server — Manufacturing module (apps/frontend)`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `docs — Smart Factory Module Declaration` to `mcp-server — Manufacturing module (apps/frontend)`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `python`, `ceylon_services`, `eslintConfig` to the rest of the system?**
  _558 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Buying Reports Hub` be split into smaller, more focused modules?**
  _Cohesion score 0.055414474877562125 - nodes in this community are weakly interconnected._