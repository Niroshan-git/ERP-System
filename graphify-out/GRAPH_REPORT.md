# Graph Report - D:/_07_ERP/ERP System  (2026-09-19)

## Corpus Check
- 21 files · ~636,855 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1696 nodes · 4132 edges · 175 communities (119 shown, 56 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 66 edges (avg confidence: 0.75)
- Token cost: 168,197 input · 0 output

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
- patches — __init__
- smart_factory — __init__
- templates — __init__
- pages — __init__
- ERP System — Ceylon Stack Naming & Positioning
- ERP System — Ceylon Stack Color Tokens (sapphire/cinnamon...
- ERP System — Mark & Logo Assets (gemstone mark)
- ERP System — Typography (Fraunces/Archivo/IBM Plex)
- ERP System — Voice & Tone Guidelines
- package — Frontend Type System (IBM Plex Sans/Mono)
- docs — Extension Points (Building Around ERPNext)
- docs — Accounting Module Reference
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
- **Manufacturing Backend Knowledge Baseline Document Set** — docs_backend_05_manufacturing_readme_doc, docs_backend_05_manufacturing_work_order_doc, docs_backend_05_manufacturing_material_transfer_doc, docs_backend_05_manufacturing_job_card_doc, docs_backend_05_manufacturing_bom_doc, docs_backend_11_relationships_master_erd_doc [EXTRACTED 1.00]
- **BOM Package 4A Cross-Document Delivery Group** — docs_backend_05_manufacturing_bom_frontend_capability, docs_operations_ai_work_log_bom_package4a, qa_log_bom_package4a_qa, progress_bom_package4a, docs_backend_99_unverified_unverified_behaviours_mfg_unv_010 [EXTRACTED 1.00]
- **CX-MFG Governance-Closure Findings Group** — docs_operations_ai_work_log_cx_mfg_001, docs_operations_ai_work_log_cx_mfg_002, docs_operations_ai_work_log_cx_mfg_003, docs_operations_ai_work_log_cx_mfg_004, docs_operations_ai_work_log_cx_mfg_006, docs_operations_ai_work_log_manufacturing_package5, docs_operations_ai_work_log_manufacturing_package3, docs_operations_ai_work_log_manufacturing_package2 [EXTRACTED 1.00]
- **Master Data Canonicalization Domain Packages** — docs_operations_ai_work_log_md_item_domain, docs_operations_ai_work_log_md_business_partner_domain, docs_operations_ai_work_log_md_inventory_structure_domain, docs_operations_ai_work_log_bom_package4a, docs_operations_ai_work_log_md1_package [EXTRACTED 1.00]
- **Current Mission priority lock sequencing reflected across control and product docs** — claude_document, docs_controls_frontend_guide_module_priority_order, docs_ceylon_stack_documentation_roadmap_manufacturing, docs_ceylon_stack_documentation_frontend_buying, docs_ceylon_stack_documentation_frontend_inventory [INFERRED 0.85]
- **Competing Ceylon Stack Color Token Systems** — docs_brand_md_color_tokens, docs_brand_ceylon_stack_branding_color_palette, docs_brand_package_ceylon_stack_frontend_design_color_palette [INFERRED 0.75]
- **MCP Agent Roster Across Docs** — docs_ceylon_stack_playbook_agent_roster, docs_mcp_agents_plan_phase2_agents, docs_ceylon_stack_documentation_roadmap_agents [INFERRED 0.85]
- **Package closure / Definition of Done workflow** — claude_package_closure_rules, claude_agents_code_reviewer, claude_agents_qa_tester, claude_agents_release_tracker, qa_log, progress [INFERRED 0.85]
- **Apps implementing the headless architecture split** — claude_headless_architecture, claude_smart_factory_app, claude_frontend_app, claude_mes_service_app, claude_mcp_server_app [INFERRED 0.85]
- **Stock-Entry-driven material deviation pattern** — docs_backend_05_manufacturing_work_order_work_order, docs_backend_05_manufacturing_material_transfer_material_transfer, docs_backend_05_manufacturing_material_transfer_mfg_stk_001, docs_backend_05_manufacturing_work_order_mfg_wf_002 [EXTRACTED 1.00]
- **Backend knowledge capture documentation pipeline** — docs_controls_backend_knowledge_policy_backend_knowledge_policy, docs_backend_00_architecture_readme_canonical_model_layer_stack, docs_backend_15_migration_migration_status_migration_status_table, docs_backend_99_unverified_unverified_behaviours_unverified_behaviours [INFERRED 0.85]
- **Agent governance binding control document system** — docs_controls_agent_operating_guide_agent_operating_guide, docs_controls_agent_usage_policy_agent_usage_policy, docs_controls_development_system_rules_development_system_rules, docs_controls_frontend_guide_frontend_guide [EXTRACTED 1.00]

## Communities (175 total, 56 thin omitted)

### Community 0 - "Buying Reports Hub"
Cohesion: 0.05
Nodes (58): createCampaignAction(), FormState, TEXT_KEYS, updateCampaignAction(), CampaignDoc, fields, fields, QuotationForLost (+50 more)

### Community 1 - "Buying & Manufacturing Detail Pages"
Cohesion: 0.06
Nodes (49): DOC_TYPES, PurchaseAnalyticsPage(), RANGES, SearchParams, TREE_TYPES, VALUE_QUANTITY, BuyingSimpleReportPage(), SearchParams (+41 more)

### Community 2 - "Shared Data Table Components"
Cohesion: 0.14
Nodes (35): MaterialRequestDoc, PurchaseInvoiceDoc, PurchaseOrderDoc, PurchaseReceiptDoc, RfqDoc, SupplierQuotationDoc, DeliveryNoteDoc, SalesInvoiceDoc (+27 more)

### Community 3 - "Backend Knowledge Docs (Manufacturing/Architecture)"
Cohesion: 0.10
Nodes (36): ColumnPicker(), DataTable(), columns, columns, columns, ProgressBar(), columns, columns (+28 more)

### Community 4 - "Sales Master Data Create Pages"
Cohesion: 0.08
Nodes (33): Config, load_config(), Configuration loading for the Ceylon Stack ERPNext MCP server., Load and validate required ERPNext connection settings.      Raises RuntimeError, ERPNextClient, ERPNextError, _extract_error(), _json() (+25 more)

### Community 5 - "Buying List Pages"
Cohesion: 0.08
Nodes (31): AppLayout(), FullscreenToggle(), activeModuleStore, BUYING_NAV_GROUPS, DashboardLink(), DEFAULT_STATE, findActiveGroupId(), isItemActive() (+23 more)

### Community 6 - "Manufacturing & Delivery List Pages"
Cohesion: 0.13
Nodes (29): MaterialRequestDetailPage(), PurchaseInvoiceDetailPage(), PurchaseOrderDetailPage(), PurchaseReceiptDetailPage(), RfqDetailPage(), SupplierQuotationDetailPage(), buildNode(), dedupeRefs() (+21 more)

### Community 7 - "Master Data Create Actions"
Cohesion: 0.16
Nodes (27): PurchaseReceiptsPage(), SearchParams, SORT_OPTIONS, STATUS_OPTIONS, CampaignRow, CampaignsPage(), QuotationsPage(), SearchParams (+19 more)

### Community 8 - "Relationship Map Components"
Cohesion: 0.10
Nodes (26): PurchaseOrdersPage(), SearchParams, SORT_OPTIONS, STATUS_OPTIONS, RequestForQuotationsPage(), SearchParams, SORT_OPTIONS, SearchParams (+18 more)

### Community 9 - "MCP Server Config & ERPNext Client"
Cohesion: 0.11
Nodes (24): formatCurrencyCard(), SalesHomePage(), formatK(), LineChart(), chipWidth(), SalesFlowMap(), SCENE_ORDER, relatedNodes() (+16 more)

### Community 10 - "App Shell & Navigation"
Cohesion: 0.13
Nodes (28): DeliveryNoteDetailPage(), SalesInvoiceDetailPage(), SalesOrderDetailPage(), QuotationDetailPage(), listItemOptions(), deliveryNoteStatus(), isOverdue(), PURCHASE_INVOICE_STATUS_TONE (+20 more)

### Community 11 - "Sales Dashboard & Charts"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 12 - "Cross-Module Detail Pages"
Cohesion: 0.11
Nodes (20): CreatePickListFromSalesOrderPage(), SalesOrderForSelection, SalesOrderItemForSelection, NewSalesOrderPage(), createPickListFromSalesOrderAction(), NewQuotationPage(), CopiedQuotationFields, CopyFromQuotationPanel() (+12 more)

### Community 13 - "Frontend Build Config"
Cohesion: 0.12
Nodes (21): SellingSettingsDoc, SellingSettingsPage(), StockEntryDetailPage(), StockEntryDoc, summarizeBatchSerialEntries(), DocTab, SellingSettingsFormShell(), SettingsFormState (+13 more)

### Community 14 - "Delivery Note Actions"
Cohesion: 0.12
Nodes (19): buildWorkOrderFields(), createWorkOrderAction(), FormState, humanizeError(), toErpDatetime(), NewWorkOrderPage(), NewStockEntryPage(), matchWarehouse() (+11 more)

### Community 15 - "RFQ & Campaign Create Flows"
Cohesion: 0.12
Nodes (20): SearchParams, SORT_OPTIONS, STATUS_OPTIONS, WorkOrdersPage(), SalesInvoicesPage(), SearchParams, SORT_OPTIONS, STATUS_OPTIONS (+12 more)

### Community 16 - "Line Items Editor & Pricing"
Cohesion: 0.13
Nodes (23): buildInvoiceItemFromPurchaseOrder(), buildInvoiceItemFromPurchaseReceipt(), buildPurchaseInvoiceFields(), cancelPurchaseInvoiceAction(), createPurchaseInvoiceAction(), createPurchaseInvoiceFromPurchaseOrder(), createPurchaseInvoiceFromPurchaseOrderAction(), createPurchaseInvoiceFromPurchaseReceipt() (+15 more)

### Community 17 - "Purchase Order Actions"
Cohesion: 0.11
Nodes (20): MaterialTransferPreviewResult, TransferMaterialPreview, TransferMaterialRow, callMethodWithResult(), deleteDoc(), DocInfoComment, DocInfoLabel, DocInfoVersion (+12 more)

### Community 18 - "Sales Invoice from Delivery Note"
Cohesion: 0.13
Nodes (15): PurchaseOrderForSelection, PurchaseOrderItemForSelection, CreateDeliveryNoteFromPickListPage(), PickListForSelection, PickListLocationForSelection, SalesOrderRateLookup, QuotationForSelection, QuotationItemForSelection (+7 more)

### Community 19 - "Purchase Invoice Actions"
Cohesion: 0.11
Nodes (18): CreateSalesInvoiceFromDeliveryNotePage(), DeliveryNoteForSelection, DeliveryNoteItemForSelection, CreateSalesInvoiceFromSalesOrderPage(), SalesOrderForSelection, SalesOrderItemForSelection, DnInvoiceItemRow, getBilledQtyBySoDetail() (+10 more)

### Community 20 - "List Pages (Filters & Sort)"
Cohesion: 0.18
Nodes (15): DeliveryNoteFormState, batchSerialTotal(), emptyRow, hasPricingRule(), LineItemsEditor(), LineRow, pricingRuleSummary(), MaterialRequestFormState (+7 more)

### Community 21 - "New Document Create Pages"
Cohesion: 0.11
Nodes (20): Smart Factory Module Declaration, Smart Factory Patches Config, Data Flow (MQTT to Frontend), frontend (dashboards, digital twin), Headless Architecture Decision, Layered View (Shop Floor to Analytics), mcp-server (ERPNext API tool wrapper), mes-service (MQTT to OEE calc) (+12 more)

### Community 22 - "Cross-Document Creation Flows"
Cohesion: 0.11
Nodes (20): Applied Dashboard UI Preview, Export-Ledger Color Palette (Sapphire/Tea/Turmeric/Terracotta), Gem-Stack Mark & Lockups, Why 'Ceylon Stack' (Naming Rationale), Ceylon Stack Color Tokens (sapphire/cinnamon/tea/turmeric/terracotta), Ceylon Stack Naming & Positioning Line, Web Favicon/Manifest Integration Snippet, Brand Guide (Visual Usage Guidelines) (+12 more)

### Community 23 - "Work Order Material Transfer"
Cohesion: 0.18
Nodes (16): buildStockEntryFields(), EligibilityDoc, FormState, humanizeError(), parseTransferRows(), saveTransferDraftAction(), submitTransferAction(), TransferRowInput (+8 more)

### Community 24 - "Stock Balance Page"
Cohesion: 0.18
Nodes (18): buildInvoiceItem(), buildInvoiceItemFromDeliveryNote(), buildSalesInvoiceFields(), bulkCreateSalesInvoicesFromOrdersAction(), cancelSalesInvoiceAction(), createSalesInvoiceAction(), createSalesInvoiceFromDeliveryNote(), createSalesInvoiceFromDeliveryNoteAction() (+10 more)

### Community 25 - "ERP System — apps/frontend README"
Cohesion: 0.18
Nodes (16): cancelPurchaseReceiptAction(), createPurchaseReceiptFromPurchaseOrderAction(), FormState, humanizeError(), PurchaseOrderForReceipt, PurchaseOrderItemForReceipt, submitPurchaseReceiptAction(), cancelRfqAction() (+8 more)

### Community 26 - "docs — Smart Factory Module Declaration"
Cohesion: 0.18
Nodes (17): ACCESS.md — Server, Repo & Command Reference, Hetzner Cloud Server (ubuntu-4gb-hel1-4), MES/OEE Service App, DevOps Agent, ERP Functional/Implementation Consultant Agent, Phase 0 ERPNext Walkthrough Gate, frappe-dev agent, frontend-dev agent (+9 more)

### Community 27 - "package — Applied Dashboard UI Preview"
Cohesion: 0.12
Nodes (17): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+9 more)

### Community 28 - "purchase-receipts — actions"
Cohesion: 0.15
Nodes (12): BomComponentRow, BomDetailPage(), BomDoc, BomOperationRow, yesNo(), SearchParams, SORT_OPTIONS, STATUS_OPTIONS (+4 more)

### Community 29 - "frontend — eslint"
Cohesion: 0.21
Nodes (16): buildSalesOrderFields(), bulkCloseSalesOrdersAction(), bulkReopenSalesOrdersAction(), cancelSalesOrderAction(), createSalesOrderAction(), createSalesOrderFromQuotationAction(), FormState, humanizeError() (+8 more)

### Community 30 - "orders — actions"
Cohesion: 0.17
Nodes (6): MODULE_CARDS, ModuleCard, CreateDeliveryNoteFromSalesOrderPage(), SalesOrderForSelection, SalesOrderItemForSelection, Breadcrumb()

### Community 31 - "agents — CLAUDE.md (master control entry point)"
Cohesion: 0.17
Nodes (7): AddressRow, ContactRow, CustomerGroupRow, TerritoryRow, MasterColumn, MasterTable(), slugify()

### Community 32 - "lib — CreatePurchaseInvoiceFromPurchaseOrderPage"
Cohesion: 0.14
Nodes (15): Ceylon Services App Overview, mes-service Overview (FastAPI real-time MES/OEE core), Local Dev Notes (pre-pull placeholder history), smart_factory App Overview (Desk theming now, Manufacturing/OEE later), Hetzner Cloud infrastructure, PLAN.md (week-by-week build plan), AGPL vs GPL license rationale (CRM/Helpdesk/Insights), ceylon_services app (+7 more)

### Community 33 - "ERP System — Hetzner Cloud infrastructure"
Cohesion: 0.13
Nodes (15): dependencies, jspdf-autotable, lucide-react, next, react, react-dom, server-only, xlsx (+7 more)

### Community 34 - "ERP System — Ceylon Services App Overview"
Cohesion: 0.24
Nodes (8): createCustomerAction(), fieldsFromForm(), FormState, humanizeError(), updateCustomerAction(), CustomerDoc, CUSTOMER_TYPES, CustomerForm()

### Community 35 - "frontend — jspdf-autotable"
Cohesion: 0.24
Nodes (8): createSupplierAction(), fieldsFromForm(), FormState, humanizeError(), updateSupplierAction(), SupplierDoc, SUPPLIER_TYPES, SupplierForm()

### Community 36 - "suppliers — SupplierForm"
Cohesion: 0.18
Nodes (14): cancelPickListAction(), createDeliveryNoteFromPickListAction(), FormState, humanizeError(), LocationUpdateInput, parseLocationRows(), PickListForDelivery, PickListLocationForDelivery (+6 more)

### Community 37 - "work-orders — actions"
Cohesion: 0.20
Nodes (15): CLAUDE.md (master control entry point), Agro-Processing Specialist Agent, Apparel & Textile Specialist Agent, Brand/Marketing Designer Agent, code-reviewer agent, Finance & Reporting Agent, product-designer agent, qa-tester agent (+7 more)

### Community 38 - "customers — CustomerForm"
Cohesion: 0.14
Nodes (15): BOM Creator (separate doctype), BOM DocType, BOM Item (child table), BOM Operation (child table), BOM Costing Fields, Multi-Level / Nested BOM, Operation/Routing/Workstation Classification, Production Plan Relationship (+7 more)

### Community 39 - "pick-lists — actions"
Cohesion: 0.15
Nodes (15): canTransferMaterials() eligibility gate, erpnext.work_order.make_stock_entry, Material Transfer for Manufacture, MFG-STK-001 fg_completed_qty gate, MFG-STK-002 Additional material lifecycle, MFG-STK-003 Quantity headroom, MFG-VAL-004 Warehouse validity server-side, MFG-VAL-005 Batch/serial guard (+7 more)

### Community 40 - "supplier-quotations — actions"
Cohesion: 0.16
Nodes (9): NewMaterialRequestPage(), NewDeliveryNotePage(), NewSalesInvoicePage(), DeliveryNoteForm(), MaterialRequestForm(), SalesInvoiceForm(), SalesInvoiceFormState, ItemLineDefaults (+1 more)

### Community 41 - "addresses — actions"
Cohesion: 0.22
Nodes (10): NewPurchaseInvoicePage(), NewPurchaseOrderPage(), CreatePurchaseOrderFromSupplierQuotationPage(), SupplierQuotationForPO, SupplierQuotationItemForPO, PurchaseInvoiceForm(), PurchaseOrderForm(), CompanyDoc (+2 more)

### Community 42 - "agents — MES/OEE Service App"
Cohesion: 0.16
Nodes (11): JobCardRow, MaterialTransferRow, WorkOrderDetailPage(), WorkOrderDoc, WorkOrderItemRow, WorkOrderOperationRow, columns, WorkOrderRow (+3 more)

### Community 43 - "lib — route"
Cohesion: 0.22
Nodes (8): CHECKBOX_KEYS, createAddressAction(), FormState, TEXT_KEYS, updateAddressAction(), validate(), ADDRESS_TYPES, AddressDoc

### Community 44 - "items — ItemForm"
Cohesion: 0.25
Nodes (13): attachBatchSerialBundles(), BatchSerialAttachInput, buildDeliveryNoteFields(), cancelDeliveryNoteAction(), createDeliveryNoteAction(), createDeliveryNoteFromSalesOrderAction(), FormState, humanizeError() (+5 more)

### Community 45 - "stock-entries — actions"
Cohesion: 0.24
Nodes (11): cancelSupplierQuotationAction(), createSupplierQuotationFromRfqAction(), FormState, humanizeError(), SourceRfq, SourceRfqItem, submitSupplierQuotationAction(), LineRowInput (+3 more)

### Community 46 - "actions — WorkOrderForm"
Cohesion: 0.27
Nodes (6): createItemAction(), FormState, humanizeError(), updateItemAction(), ItemDoc, ItemForm()

### Community 47 - "quotations — actions"
Cohesion: 0.17
Nodes (13): Job Card (read-only fields), MFG-VAL-006 Quality Readiness rule, MFG-UNV-004a operations table stays empty on REST insert, MFG-VAL-001 Production Item create restriction, MFG-VAL-003 Draft-stage required_qty reversion, MFG-WF-001 Create-only lifecycle in this frontend, Work Order, Work Order Operation (operations) (+5 more)

### Community 48 - "actions — CopyFromQuotationPanel"
Cohesion: 0.30
Nodes (11): buildPurchaseOrderFields(), cancelPurchaseOrderAction(), createPurchaseOrderAction(), createPurchaseOrderFromSupplierQuotationAction(), FormState, humanizeError(), parsePurchaseOrderItems(), PurchaseOrderItemInput (+3 more)

### Community 49 - "components — PickListLocationsTable"
Cohesion: 0.20
Nodes (7): createContactAction(), FormState, TEXT_KEYS, updateContactAction(), ContactDoc, fields, fields

### Community 50 - "sales-partners — actions"
Cohesion: 0.23
Nodes (9): PickListDetailPage(), PickListDoc, PickListLocation, PickListLocationRow, PickListLocationsTable(), EditablePickListLocation, EditorState, PickListPickedQtyEditor() (+1 more)

### Community 51 - "batches — actions"
Cohesion: 0.30
Nodes (11): amendQuotationAction(), buildQuotationFields(), cancelQuotationAction(), createQuotationAction(), FormState, humanizeError(), QuotationForAmend, setQuotationAsLostAction() (+3 more)

### Community 52 - "scripts — CompletedProcess"
Cohesion: 0.30
Nodes (11): attachBatchSerialBundles(), buildStockEntryFields(), cancelStockEntryAction(), createStockEntryAction(), FormState, humanizeError(), Purpose, PURPOSES (+3 more)

### Community 53 - "lib — jspdf"
Cohesion: 0.21
Nodes (12): BOM-Work Order Relationship, MFG-UNV-007: Work Order Operation Field-Copy Convention, MFG-UNV-008: Duplicate item_code Rows in required_items, CX-MFG-006: Duplicate Item Row Key Handling, Manufacturing Packages 2/3/5 Governance-Closure Corrections, Manufacturing Package 4 - Work Order Material Change Investigation, Manufacturing Package 5 - Material Transfer for Manufacture, QA: Manufacturing Packages 2/3/5 Governance-Closure Corrections (+4 more)

### Community 54 - "material-requests — actions"
Cohesion: 0.22
Nodes (6): CHECKBOX_KEYS, createCustomerGroupAction(), FormState, TEXT_KEYS, updateCustomerGroupAction(), CustomerGroupDoc

### Community 55 - "components — SellingSettingsFormShell"
Cohesion: 0.22
Nodes (6): CHECKBOX_KEYS, createItemGroupAction(), FormState, TEXT_KEYS, updateItemGroupAction(), ItemGroupDoc

### Community 56 - "serial-nos — actions"
Cohesion: 0.22
Nodes (6): CHECKBOX_KEYS, createPriceListAction(), FormState, TEXT_KEYS, updatePriceListAction(), PriceListDoc

### Community 57 - "frontend — package.json"
Cohesion: 0.22
Nodes (6): CHECKBOX_KEYS, createTerritoryAction(), FormState, TEXT_KEYS, updateTerritoryAction(), TerritoryDoc

### Community 58 - "[name] — DocLink"
Cohesion: 0.29
Nodes (6): buildWarehouseFields(), createWarehouseAction(), FormState, humanizeError(), updateWarehouseAction(), WarehouseDoc

### Community 59 - "actions — BatchSerialPicker"
Cohesion: 0.24
Nodes (11): frontend Next.js app, Headless Architecture Decision, mcp-server app, mes-service app, smart_factory Frappe app, Brand Rollout Order (Desk -> smart_factory -> frontend -> docs), ADR-001: Use ERPNext/Frappe as initial reference backend, Week 7-8: Mobile-Friendly Frontend + Dashboards (+3 more)

### Community 60 - "mcp-server — Manufacturing module (apps/frontend)"
Cohesion: 0.40
Nodes (10): CompletedProcess, bench(), docker_exec(), ensure_frontend_has_app(), ensure_hostname_alias(), main(), preflight_check_apps_on_backend(), Fail fast, before creating anything, if this bench has never had 	`bench get-app (+2 more)

### Community 61 - "create-supplier-quotation — CreateSupplierQuotationForm"
Cohesion: 0.18
Nodes (11): Architecture Decision Records, Canonical Mapping Standard, Canonical Model Layer Stack, FRAPPE_CURRENT_BEHAVIOR tag, FRAPPE_ONLY_IMPLEMENTATION_DETAIL tag, REQUIRED_CEYLON_BEHAVIOR tag, Two Backends, One Product, Ceylon Stack Backend Knowledge Base (+3 more)

### Community 62 - "transfer-materials — actions"
Cohesion: 0.31
Nodes (8): jspdf, ExportMenu(), csvEscape(), downloadBlob(), exportToCsv(), exportToExcel(), exportToPdf(), jspdf

### Community 63 - "material-requests — MaterialRequestsPage"
Cohesion: 0.36
Nodes (9): buildMaterialRequestFields(), cancelMaterialRequestAction(), createMaterialRequestAction(), FormState, humanizeError(), MaterialRequestItemInput, parseMaterialRequestItems(), submitMaterialRequestAction() (+1 more)

### Community 64 - "purchase-orders — PurchaseOrdersPage"
Cohesion: 0.24
Nodes (7): CreateRfqFromMaterialRequestPage(), MaterialRequestForRfq, MaterialRequestItemForRfq, CreateRfqForm(), FormState, ItemForDisplay, SupplierMultiSelect()

### Community 65 - "purchase-receipts — PurchaseReceiptsPage"
Cohesion: 0.29
Nodes (8): ConfirmedLineRow, CopyableQuotation, getQuotationForCopy(), listCopyableQuotations(), QuotationDocForCopy, QuotationForCopy, QuotationItemDoc, QuotationItemForCopy

### Community 66 - "quotations — QuotationsPage"
Cohesion: 0.22
Nodes (10): MFG-UNV-005: GL Impact of Material Transfer for Manufacture, CX-MFG-001: Material Transfer Server Action Trust Boundary, CX-MFG-002: Work Order Operations Copy Incomplete, CX-MFG-003: Quality Readiness Ratio Miscount, CX-MFG-004: Stale Manufacturing Documentation, Claude/Codex Dual-Agent Review Coordination Model, Package: Manufacturing Package 2 (Work Order Detail), Package: Manufacturing Package 3 (Work Order Create) (+2 more)

### Community 67 - "stock-entries — PURPOSE_OPTIONS"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 68 - "docs — What's Inside ERPNext (Feature Pack)"
Cohesion: 0.22
Nodes (8): ADVANCE_PAYMENT_STATUS_OPTIONS, BILLING_STATUS_OPTIONS, DELIVERY_STATUS_OPTIONS, SalesOrdersPage(), SearchParams, SORT_OPTIONS, SalesOrderBulkTable(), SalesOrderRow

### Community 69 - "ERP System — ACCESS.md — Server, Repo & Command Reference"
Cohesion: 0.33
Nodes (7): BatchSerialEntry, BatchSerialPicker(), AutoBatchRow, AutoSerialRow, BatchSerialLedgerEntry, getAutoBatchSerialData(), SerialBatchBundleEntry

### Community 70 - "docker — backend/db/queue/scheduler/websocket services"
Cohesion: 0.31
Nodes (9): BOM Read-Only Frontend Capability (Package 4A), MFG-UNV-001: Work Order List Indicator Colors Unconfirmed, MFG-UNV-010: BOM Detail Page Status-Tone Mapping and Route Walkthrough, Package: Manufacturing Masters - BOM Package 4A, Package: Master Data Navigation Foundation (MD-1), Package: Master Data Canonicalization - Inventory Structure Domain, Package: Master Data Canonicalization - Item Domain, Manufacturing Masters - BOM Package 4A (+1 more)

### Community 71 - "lib — route"
Cohesion: 0.36
Nodes (8): Manufacturing module (apps/frontend), apps/mcp-server README, Discovery tools (ping, list_doctypes, get_doctype_fields, list_documents), Manufacturing MCP tools (get_manufacturing_overview, get_work_order_detail, list_work_orders, list_job_cards, get_job_card_detail), Two-tier access model (dev tier vs client tier), inventory-procurement agent, mcp-dev agent, Current Mission Priority Lock

### Community 72 - "components — PurchaseInvoiceForm"
Cohesion: 0.29
Nodes (6): CompanyDoc, CreateSupplierQuotationPage(), RfqForSq, RfqItemForSq, CreateSupplierQuotationForm(), FormState

### Community 73 - "create-invoice — CreateSalesInvoiceFromSalesOrderPage"
Cohesion: 0.29
Nodes (7): apps/frontend README, Service-account proxy auth model, Buying module (apps/frontend), Ceylon Stack frontend design system, Inventory/Stock module (apps/frontend), Sales module (apps/frontend), Frontend Design Doc Supersedes DESIGN.md for apps/frontend

### Community 74 - "app — layout"
Cohesion: 0.29
Nodes (6): MaterialRequestsPage(), SearchParams, SORT_OPTIONS, STATUS_OPTIONS, MaterialRequestRow, MaterialRequestsTable()

### Community 75 - "decisions — Architecture Decision Records doc"
Cohesion: 0.29
Nodes (6): PurchaseInvoicesPage(), SearchParams, SORT_OPTIONS, STATUS_OPTIONS, PurchaseInvoiceRow, PurchaseInvoicesTable()

### Community 76 - "(app) — HomePage"
Cohesion: 0.29
Nodes (6): SearchParams, SORT_OPTIONS, STATUS_OPTIONS, SupplierQuotationsPage(), SupplierQuotationRow, SupplierQuotationsTable()

### Community 77 - "docs — Industries & Fit (8 Sri Lankan Segments)"
Cohesion: 0.29
Nodes (6): DeliveryNotesPage(), SearchParams, SORT_OPTIONS, STATUS_OPTIONS, DeliveryNoteRow, DeliveryNotesTable()

### Community 78 - "docs — Discount Logic Comparison"
Cohesion: 0.29
Nodes (7): What's Inside ERPNext (Feature Pack), Ceylon Stack Playbook Overview, HR & Payroll — Frappe HR (Separate App), Before You Rebrand — GPL-3.0 Note, ERPNext Platform Reference Overview, Handoff Note for Separate Developer, Licensing Note (GPL-3.0 hrms vs AGPL-3.0 crm/helpdesk/insights)

### Community 79 - "ceylon_services — install"
Cohesion: 0.29
Nodes (7): Ceylon Stack Desk Rebrand, Frontend/Backend Container Filesystem Split Gotcha, Gunicorn Worker Restart-on-Install Gotcha, Headless Architecture Decision, Oracle Cloud to Hetzner Migration Decision, FRAPPE_SITE_NAME_HEADER Multi-Tenancy Fix, smart_factory Custom Frappe App

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
Cohesion: 0.53
Nodes (6): Master ERD, BOM (ERD entity), JOB_CARD (ERD entity), PRODUCTION_PLAN (ERD entity), STOCK_ENTRY (ERD entity), WORK_ORDER (ERD entity)

### Community 84 - "docs — Practice Site Setup Steps (bench new-site)"
Cohesion: 0.33
Nodes (6): Accounting (GL, AR, AP) Migration Domain, Inventory/Stock Migration Domain, Manufacturing - Work Order + Material Transfer Migration Domain, Master Data Migration Domain, Purchasing/Buying Migration Domain, Sales Migration Domain

### Community 85 - ".mcp.json"
Cohesion: 0.40
Nodes (6): backend/db/queue/scheduler/websocket services, frontend service (nginx-entrypoint, FRAPPE_SITE_NAME_HEADER), Swarm-mode restart_policy (No-Op under docker compose), Known Open Gaps (Restart Policy, Default Passwords), pwd.yml FRAPPE_SITE_NAME_HEADER Fix (Critical), Operational Scripts (Backup/Deploy/Health Check)

### Community 86 - "ceylon_services — boot"
Cohesion: 0.60
Nodes (4): POST(), verifyErpNextLogin(), bytesToBase64Url(), signSession()

### Community 87 - "ceylon_services — ceylon_services Proprietary License"
Cohesion: 0.50
Nodes (4): CreatePurchaseInvoiceFromPurchaseOrderPage(), PurchaseOrderForSelection, PurchaseOrderItemForSelection, getBilledQtyByPoDetail()

### Community 88 - "ceylon_services — ceylon_services Pre-commit Hooks Config"
Cohesion: 0.40
Nodes (3): metadata, plexMono, plexSans

### Community 89 - "frontend — Next.js Agent Rules Notice (auto-generated bre..."
Cohesion: 0.60
Nodes (3): StockBadge(), BinQty, getBinQty()

### Community 90 - "frontend — eslint.config.mjs"
Cohesion: 0.40
Nodes (4): PricingContext, PricingResolution, PricingRuleApiItem, resolvePricingForLine()

### Community 91 - "frontend — next.config"
Cohesion: 0.60
Nodes (5): Architecture Decision Records doc, ADR-002: Keep canonical model independent from Frappe, ADR-004: Migrate native backend domain-by-domain, ADR-005: Use behavioral compatibility tests before migrating any domain, ADR-006: Do not migrate accounting/stock valuation until verified

### Community 92 - "frontend — postcss.config.mjs"
Cohesion: 0.40
Nodes (5): API Layer Rules (lib/erpnext.ts), Ceylon Stack Frontend Guide, lib/erpnext.ts, lib/linkOptions.ts, Provenance note (Grok-drafted, reconciled against real codebase 2026-09-15)

### Community 94 - "brand — Three Type Faces, Three Jobs"
Cohesion: 0.50
Nodes (4): Industries & Fit (8 Sri Lankan Segments), Manufacturing Module Reference, What's Relevant to Ceylon Stack v1, Stock (Inventory) Module Reference

### Community 95 - "controls — Definition of Ready"
Cohesion: 0.50
Nodes (4): Discount Logic Comparison, Native vs Gaps Scoping Decision (Phase 1), Quotation Scenarios (ERPNext vs SAP B1 vs Acumatica vs D365), Sales Order Scenarios (Partial Delivery, Backorder, Blanket Orders)

### Community 102 - "ceylon_services — ceylon_services modules.txt (module reg..."
Cohesion: 0.67
Nodes (3): Cancellation & Amendment Logic, Universal Document Flow (Lead to Payment), Returns / Credit Notes Comparison

### Community 103 - "ceylon_services — ceylon_services patches.txt (migration ..."
Cohesion: 1.00
Nodes (3): Agent Operating Guide, Agent Usage Policy, Development System Rules

### Community 104 - "patches — __init__"
Cohesion: 0.67
Nodes (3): Buying Module – Next Focus, Manufacturing Module – Following Module, Stock Module – Current Focus

### Community 105 - "js — ceylon_services_desk.js"
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
- **56 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Ceylon Stack Color Tokens (sapphire/cinnamon/tea/turmeric/terracotta)` and `Industrial-Functional Color Palette (graphite/signal/alert/success)`?**
  _Edge tagged AMBIGUOUS (relation: semantically_similar_to) - confidence is low._
- **What is the exact relationship between `Brand Guide (Visual Usage Guidelines)` and `Ceylon Stack Brand Guide (Full Package Doc)`?**
  _Edge tagged AMBIGUOUS (relation: semantically_similar_to) - confidence is low._
- **Why does `fetchLinkOptions()` connect `Relationship Map Components` to `Buying Reports Hub`, `Buying & Manufacturing Detail Pages`, `Shared Data Table Components`, `Manufacturing & Delivery List Pages`, `Master Data Create Actions`, `MCP Server Config & ERPNext Client`, `App Shell & Navigation`, `Cross-Module Detail Pages`, `Frontend Build Config`, `Delivery Note Actions`, `RFQ & Campaign Create Flows`, `supplier-quotations — actions`, `addresses — actions`, `purchase-orders — PurchaseOrdersPage`, `docs — What's Inside ERPNext (Feature Pack)`, `components — PurchaseInvoiceForm`, `app — layout`, `decisions — Architecture Decision Records doc`, `(app) — HomePage`, `docs — Industries & Fit (8 Sri Lankan Segments)`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `dependencies` connect `ERP System — Hetzner Cloud infrastructure` to `stock-entries — PURPOSE_OPTIONS`, `transfer-materials — actions`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `package — Applied Dashboard UI Preview` to `stock-entries — PURPOSE_OPTIONS`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `python`, `ceylon_services`, `eslintConfig` to the rest of the system?**
  _558 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Buying Reports Hub` be split into smaller, more focused modules?**
  _Cohesion score 0.053297199638663056 - nodes in this community are weakly interconnected._