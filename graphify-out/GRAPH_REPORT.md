# Graph Report - .  (2026-09-17)

## Corpus Check
- Large corpus: 456 files · ~580,754 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 1626 nodes · 4573 edges · 140 communities (101 shown, 39 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 62 edges (avg confidence: 0.78)
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
- controls — Mission Lock Drift Note
- docs — Cancellation & Amendment Logic
- docs — Practice Site Setup Steps (bench new-site)
- .mcp.json
- ceylon_services — ceylon_services Proprietary License
- ceylon_services — ceylon_services Pre-commit Hooks Config
- frontend — Next.js Agent Rules Notice (auto-generated bre...
- frontend — eslint.config.mjs
- frontend — next.config
- frontend — postcss.config.mjs
- brand — Three Type Faces, Three Jobs
- controls — Definition of Ready
- scripts — add-nip-io-alias.sh
- scripts — sync-app-branch.sh
- ceylon_services — ceylon_services modules.txt (module reg...
- ceylon_services — ceylon_services patches.txt (migration ...
- mcp-server — mcp-server Python Dependencies (mcp, httpx, ...
- ERP System — Ceylon Stack Naming & Positioning
- ERP System — Ceylon Stack Color Tokens (sapphire/cinnamon...
- ERP System — Mark & Logo Assets (gemstone mark)
- ERP System — Typography (Fraunces/Archivo/IBM Plex)
- ERP System — Voice & Tone Guidelines
- ERP System — The 'What's Underneath' Answer
- docs — Multi-Client Path (Frappe Multi-Site)
- 05-manufacturing — Manufacturing Documentation Scope (202...
- brand — Ceylon Stack Brand Voice
- package — Frontend Type System (IBM Plex Sans/Mono)
- docs — Extension Points (Building Around ERPNext)
- docs — Licensing (GPL-3.0) — Playbook
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

## God Nodes (most connected - your core abstractions)
1. `fetchLinkOptions()` - 135 edges
2. `listDocs()` - 82 edges
3. `ErpNextError` - 72 edges
4. `getDoc()` - 71 edges
5. `getCount()` - 60 edges
6. `parsePage()` - 59 edges
7. `parsePageSize()` - 59 edges
8. `paginate()` - 59 edges
9. `updateDoc()` - 54 edges
10. `listItemOptions()` - 39 edges

## Surprising Connections (you probably didn't know these)
- `smart_factory app created — full Desk branding pass (2026-09-12)` --semantically_similar_to--> `smart_factory Frappe app`  [INFERRED] [semantically similar]
  PROGRESS.md → CLAUDE.md
- `Manufacturing module frontend packages (2026-09-17)` --semantically_similar_to--> `Manufacturing module (apps/frontend)`  [INFERRED] [semantically similar]
  PROGRESS.md → apps/frontend/README.md
- `Manufacturing package 4 investigation QA (WO material change)` --semantically_similar_to--> `ADR-005: Use behavioral compatibility tests before migrating any domain`  [INFERRED] [semantically similar]
  QA_LOG.md → docs/architecture/decisions/README.md
- `Two-tier access model (dev tier vs client tier)` --semantically_similar_to--> `Current Mission Priority Lock`  [INFERRED] [semantically similar]
  apps/mcp-server/README.md → CLAUDE.md
- `Hetzner ERPNext deployment` --semantically_similar_to--> `Hetzner Cloud infrastructure`  [INFERRED] [semantically similar]
  PROGRESS.md → CLAUDE.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Competing Ceylon Stack Color Token Systems** — docs_brand_md_color_tokens, docs_brand_ceylon_stack_branding_color_palette, docs_brand_package_ceylon_stack_frontend_design_color_palette [INFERRED 0.75]
- **MCP Agent Roster Across Docs** — docs_ceylon_stack_playbook_agent_roster, docs_mcp_agents_plan_phase2_agents, docs_ceylon_stack_documentation_roadmap_agents [INFERRED 0.85]
- **Package closure / Definition of Done workflow** — claude_package_closure_rules, claude_agents_code_reviewer, claude_agents_qa_tester, claude_agents_release_tracker, qa_log, progress [INFERRED 0.85]
- **Manufacturing frontend unlock sequencing gate** — claude_current_mission_lock, progress_inventory_mvp_shipped, progress_buying_core_cycle_qa, progress_manufacturing_packages [INFERRED 0.85]
- **Apps implementing the headless architecture split** — claude_headless_architecture, claude_smart_factory_app, claude_frontend_app, claude_mes_service_app, claude_mcp_server_app [INFERRED 0.85]
- **Stock-Entry-driven material deviation pattern** — docs_backend_05_manufacturing_work_order_work_order, docs_backend_05_manufacturing_material_transfer_material_transfer, docs_backend_05_manufacturing_material_transfer_mfg_stk_001, docs_backend_05_manufacturing_work_order_mfg_wf_002 [EXTRACTED 1.00]
- **Backend knowledge capture documentation pipeline** — docs_controls_backend_knowledge_policy_backend_knowledge_policy, docs_backend_00_architecture_readme_canonical_model_layer_stack, docs_backend_15_migration_migration_status_migration_status_table, docs_backend_99_unverified_unverified_behaviours_unverified_behaviours [INFERRED 0.85]
- **Agent governance binding control document system** — docs_controls_agent_operating_guide_agent_operating_guide, docs_controls_agent_usage_policy_agent_usage_policy, docs_controls_development_system_rules_development_system_rules, docs_controls_frontend_guide_frontend_guide [EXTRACTED 1.00]

## Communities (140 total, 39 thin omitted)

### Community 0 - "Buying Reports Hub"
Cohesion: 0.05
Nodes (52): DOC_TYPES, PurchaseAnalyticsPage(), RANGES, SearchParams, TREE_TYPES, VALUE_QUANTITY, BuyingSimpleReportPage(), SearchParams (+44 more)

### Community 1 - "Buying & Manufacturing Detail Pages"
Cohesion: 0.12
Nodes (36): MaterialRequestDoc, PurchaseInvoiceDoc, PurchaseOrderDoc, PurchaseReceiptDoc, RfqDoc, SupplierQuotationDoc, DeliveryNoteDoc, SalesInvoiceDoc (+28 more)

### Community 2 - "Shared Data Table Components"
Cohesion: 0.11
Nodes (36): ColumnPicker(), columns, DataTable(), columns, columns, columns, columns, ProgressBar() (+28 more)

### Community 3 - "Backend Knowledge Docs (Manufacturing/Architecture)"
Cohesion: 0.05
Nodes (59): Architecture Decision Records, Canonical Mapping Standard, Canonical Model Layer Stack, FRAPPE_CURRENT_BEHAVIOR tag, FRAPPE_ONLY_IMPLEMENTATION_DETAIL tag, REQUIRED_CEYLON_BEHAVIOR tag, Two Backends, One Product, Job Card (read-only fields) (+51 more)

### Community 4 - "Sales Master Data Create Pages"
Cohesion: 0.08
Nodes (35): fields, fields, CustomerGroupDoc, EditCustomerGroupPage(), NewCustomerGroupPage(), EditItemGroupPage(), ItemGroupDoc, NewItemGroupPage() (+27 more)

### Community 5 - "Buying List Pages"
Cohesion: 0.14
Nodes (41): PurchaseInvoicesPage(), RequestForQuotationsPage(), SuppliersPage(), AddressesPage(), AddressRow, CampaignRow, CampaignsPage(), ContactRow (+33 more)

### Community 6 - "Manufacturing & Delivery List Pages"
Cohesion: 0.06
Nodes (39): SearchParams, SORT_OPTIONS, SearchParams, SORT_OPTIONS, STATUS_OPTIONS, WorkOrdersPage(), DeliveryNotesPage(), SearchParams (+31 more)

### Community 7 - "Master Data Create Actions"
Cohesion: 0.11
Nodes (37): createCampaignAction(), FormState, TEXT_KEYS, updateCampaignAction(), createContactAction(), FormState, TEXT_KEYS, updateContactAction() (+29 more)

### Community 8 - "Relationship Map Components"
Cohesion: 0.09
Nodes (38): DOCTYPE_ICON, RelationshipMap(), buildNode(), dedupeRefs(), DocRef, findRoots(), getChildren(), HREF_BASE (+30 more)

### Community 9 - "MCP Server Config & ERPNext Client"
Cohesion: 0.08
Nodes (34): Config, load_config(), Configuration loading for the Ceylon Stack ERPNext MCP server., Load and validate required ERPNext connection settings.      Raises RuntimeError, ERPNextClient, ERPNextError, _extract_error(), _json() (+26 more)

### Community 10 - "App Shell & Navigation"
Cohesion: 0.08
Nodes (30): AppLayout(), FullscreenToggle(), activeModuleStore, BUYING_NAV_GROUPS, DashboardLink(), DEFAULT_STATE, findActiveGroupId(), isItemActive() (+22 more)

### Community 11 - "Sales Dashboard & Charts"
Cohesion: 0.11
Nodes (24): formatCurrencyCard(), SalesHomePage(), formatK(), LineChart(), chipWidth(), SalesFlowMap(), SCENE_ORDER, relatedNodes() (+16 more)

### Community 12 - "Cross-Module Detail Pages"
Cohesion: 0.16
Nodes (28): MaterialRequestDetailPage(), PurchaseInvoiceDetailPage(), PurchaseOrderDetailPage(), PurchaseReceiptDetailPage(), RfqDetailPage(), SupplierQuotationDetailPage(), DeliveryNoteDetailPage(), SalesInvoiceDetailPage() (+20 more)

### Community 13 - "Frontend Build Config"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 14 - "Delivery Note Actions"
Cohesion: 0.12
Nodes (24): attachBatchSerialBundles(), BatchSerialAttachInput, buildDeliveryNoteFields(), cancelDeliveryNoteAction(), createDeliveryNoteAction(), createDeliveryNoteFromSalesOrderAction(), FormState, humanizeError() (+16 more)

### Community 15 - "RFQ & Campaign Create Flows"
Cohesion: 0.09
Nodes (17): CreateRfqFromMaterialRequestPage(), MaterialRequestForRfq, MaterialRequestItemForRfq, CampaignDoc, fields, ContactDoc, fields, QuotationForLost (+9 more)

### Community 16 - "Line Items Editor & Pricing"
Cohesion: 0.14
Nodes (20): DiscountFields(), batchSerialTotal(), emptyRow, hasPricingRule(), LineItemsEditor(), LineRow, pricingRuleSummary(), ORDER_TYPES (+12 more)

### Community 17 - "Purchase Order Actions"
Cohesion: 0.14
Nodes (21): buildPurchaseOrderFields(), cancelPurchaseOrderAction(), createPurchaseOrderAction(), createPurchaseOrderFromSupplierQuotationAction(), FormState, humanizeError(), parsePurchaseOrderItems(), PurchaseOrderItemInput (+13 more)

### Community 18 - "Sales Invoice from Delivery Note"
Cohesion: 0.14
Nodes (22): CreateSalesInvoiceFromDeliveryNotePage(), DeliveryNoteForSelection, DeliveryNoteItemForSelection, buildInvoiceItem(), buildInvoiceItemFromDeliveryNote(), buildSalesInvoiceFields(), bulkCreateSalesInvoicesFromOrdersAction(), cancelSalesInvoiceAction() (+14 more)

### Community 19 - "Purchase Invoice Actions"
Cohesion: 0.15
Nodes (21): buildInvoiceItemFromPurchaseOrder(), buildInvoiceItemFromPurchaseReceipt(), buildPurchaseInvoiceFields(), cancelPurchaseInvoiceAction(), createPurchaseInvoiceAction(), createPurchaseInvoiceFromPurchaseOrder(), createPurchaseInvoiceFromPurchaseOrderAction(), createPurchaseInvoiceFromPurchaseReceipt() (+13 more)

### Community 20 - "List Pages (Filters & Sort)"
Cohesion: 0.13
Nodes (17): SearchParams, SORT_OPTIONS, STATUS_OPTIONS, SearchParams, SORT_OPTIONS, STATUS_OPTIONS, SupplierQuotationsPage(), BatchRow (+9 more)

### Community 21 - "New Document Create Pages"
Cohesion: 0.15
Nodes (14): NewMaterialRequestPage(), NewDeliveryNotePage(), NewSalesInvoicePage(), NewSalesOrderPage(), NewQuotationPage(), DeliveryNoteForm(), DeliveryNoteFormState, MaterialRequestForm() (+6 more)

### Community 22 - "Cross-Document Creation Flows"
Cohesion: 0.13
Nodes (15): PurchaseOrderForSelection, PurchaseOrderItemForSelection, CreateDeliveryNoteFromPickListPage(), PickListForSelection, PickListLocationForSelection, SalesOrderRateLookup, QuotationForSelection, QuotationItemForSelection (+7 more)

### Community 23 - "Work Order Material Transfer"
Cohesion: 0.14
Nodes (17): TransferMaterialsPage(), WorkOrderDoc, AdditionalRow, MaterialTransferForm(), RequiredMaterialRow, round4(), TransferFormState, StockBadge() (+9 more)

### Community 24 - "Stock Balance Page"
Cohesion: 0.12
Nodes (19): SearchParams, SORT_OPTIONS, StockBalancePage(), StockBalanceRow, StockBalanceTable(), deleteDoc(), DocInfoComment, DocInfoLabel (+11 more)

### Community 25 - "ERP System — apps/frontend README"
Cohesion: 0.14
Nodes (20): apps/frontend README, Service-account proxy auth model, Buying module (apps/frontend), Ceylon Stack frontend design system, Inventory/Stock module (apps/frontend), Sales module (apps/frontend), qa-tester agent, Frontend Design Doc Supersedes DESIGN.md for apps/frontend (+12 more)

### Community 26 - "docs — Smart Factory Module Declaration"
Cohesion: 0.11
Nodes (20): Smart Factory Module Declaration, Smart Factory Patches Config, Data Flow (MQTT to Frontend), frontend (dashboards, digital twin), Headless Architecture Decision, Layered View (Shop Floor to Analytics), mcp-server (ERPNext API tool wrapper), mes-service (MQTT to OEE calc) (+12 more)

### Community 27 - "package — Applied Dashboard UI Preview"
Cohesion: 0.11
Nodes (20): Applied Dashboard UI Preview, Export-Ledger Color Palette (Sapphire/Tea/Turmeric/Terracotta), Gem-Stack Mark & Lockups, Why 'Ceylon Stack' (Naming Rationale), Ceylon Stack Color Tokens (sapphire/cinnamon/tea/turmeric/terracotta), Ceylon Stack Naming & Positioning Line, Web Favicon/Manifest Integration Snippet, Brand Guide (Visual Usage Guidelines) (+12 more)

### Community 28 - "purchase-receipts — actions"
Cohesion: 0.18
Nodes (16): cancelPurchaseReceiptAction(), createPurchaseReceiptFromPurchaseOrderAction(), FormState, humanizeError(), PurchaseOrderForReceipt, PurchaseOrderItemForReceipt, submitPurchaseReceiptAction(), cancelRfqAction() (+8 more)

### Community 29 - "frontend — eslint"
Cohesion: 0.12
Nodes (17): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+9 more)

### Community 30 - "orders — actions"
Cohesion: 0.21
Nodes (16): buildSalesOrderFields(), bulkCloseSalesOrdersAction(), bulkReopenSalesOrdersAction(), cancelSalesOrderAction(), createSalesOrderAction(), createSalesOrderFromQuotationAction(), FormState, humanizeError() (+8 more)

### Community 31 - "agents — CLAUDE.md (master control entry point)"
Cohesion: 0.18
Nodes (17): CLAUDE.md (master control entry point), Agro-Processing Specialist Agent, Apparel & Textile Specialist Agent, Brand/Marketing Designer Agent, code-reviewer agent, Finance & Reporting Agent, frontend-dev agent, product-designer agent (+9 more)

### Community 32 - "lib — CreatePurchaseInvoiceFromPurchaseOrderPage"
Cohesion: 0.14
Nodes (14): CreatePurchaseInvoiceFromPurchaseOrderPage(), PurchaseOrderForSelection, PurchaseOrderItemForSelection, DnInvoiceItemRow, getBilledQtyByPoDetail(), InvoiceItemRow, PoInvoiceItemRow, PrInvoiceItemRow (+6 more)

### Community 33 - "ERP System — Hetzner Cloud infrastructure"
Cohesion: 0.19
Nodes (16): Hetzner Cloud infrastructure, AGPL vs GPL license rationale (CRM/Helpdesk/Insights), ceylon_services app, Frappe HR (hrms) product add-on, Product Portfolio plan (2026-09-13), PROGRESS.md (chronological dev log), ceylon_services app (built), deploy-smart-factory skill (+8 more)

### Community 34 - "ERP System — Ceylon Services App Overview"
Cohesion: 0.16
Nodes (15): Ceylon Services App Overview, Local Dev Notes (pre-pull placeholder history), smart_factory App Overview (Desk theming now, Manufacturing/OEE later), frontend Next.js app, Headless Architecture Decision, mcp-server app, mes-service app, smart_factory Frappe app (+7 more)

### Community 35 - "frontend — jspdf-autotable"
Cohesion: 0.13
Nodes (15): dependencies, jspdf-autotable, lucide-react, next, react, react-dom, server-only, xlsx (+7 more)

### Community 36 - "suppliers — SupplierForm"
Cohesion: 0.24
Nodes (10): createSupplierAction(), fieldsFromForm(), FormState, humanizeError(), updateSupplierAction(), EditSupplierPage(), SupplierDoc, NewSupplierPage() (+2 more)

### Community 37 - "work-orders — actions"
Cohesion: 0.22
Nodes (11): buildWorkOrderFields(), createWorkOrderAction(), FormState, humanizeError(), toErpDatetime(), NewWorkOrderPage(), NewStockEntryPage(), StockEntryForm() (+3 more)

### Community 38 - "customers — CustomerForm"
Cohesion: 0.24
Nodes (10): createCustomerAction(), fieldsFromForm(), FormState, humanizeError(), updateCustomerAction(), CustomerDoc, EditCustomerPage(), NewCustomerPage() (+2 more)

### Community 39 - "pick-lists — actions"
Cohesion: 0.18
Nodes (14): cancelPickListAction(), createDeliveryNoteFromPickListAction(), FormState, humanizeError(), LocationUpdateInput, parseLocationRows(), PickListForDelivery, PickListLocationForDelivery (+6 more)

### Community 40 - "supplier-quotations — actions"
Cohesion: 0.22
Nodes (12): cancelSupplierQuotationAction(), createSupplierQuotationFromRfqAction(), FormState, humanizeError(), SourceRfq, SourceRfqItem, submitSupplierQuotationAction(), LineRowInput (+4 more)

### Community 41 - "addresses — actions"
Cohesion: 0.22
Nodes (10): CHECKBOX_KEYS, createAddressAction(), FormState, TEXT_KEYS, updateAddressAction(), validate(), ADDRESS_TYPES, AddressDoc (+2 more)

### Community 42 - "agents — MES/OEE Service App"
Cohesion: 0.18
Nodes (14): MES/OEE Service App, mes-service Overview (FastAPI real-time MES/OEE core), ERP Functional/Implementation Consultant Agent, Phase 0 ERPNext Walkthrough Gate, frappe-dev agent, Manufacturing Floor Agent, MES/IoT Developer Agent, ERP Inventory Findings (docs/erp-inventory.md) (+6 more)

### Community 43 - "lib — route"
Cohesion: 0.19
Nodes (9): StockEntryDetailPage(), StockEntryDoc, summarizeBatchSerialEntries(), getSerialBatchBundleEntries(), stockEntryStatus(), base64UrlToBytes(), encoder, getKey() (+1 more)

### Community 44 - "items — ItemForm"
Cohesion: 0.27
Nodes (8): createItemAction(), FormState, humanizeError(), updateItemAction(), EditItemPage(), ItemDoc, NewItemPage(), ItemForm()

### Community 45 - "stock-entries — actions"
Cohesion: 0.27
Nodes (12): attachBatchSerialBundles(), buildStockEntryFields(), cancelStockEntryAction(), createStockEntryAction(), FormState, humanizeError(), Purpose, PURPOSES (+4 more)

### Community 46 - "actions — WorkOrderForm"
Cohesion: 0.23
Nodes (11): matchWarehouse(), round4(), WorkOrderForm(), WorkOrderFormState, BomDetail, BomItemRow, BomOperationRow, BomOption (+3 more)

### Community 47 - "quotations — actions"
Cohesion: 0.30
Nodes (11): amendQuotationAction(), buildQuotationFields(), cancelQuotationAction(), createQuotationAction(), FormState, humanizeError(), QuotationForAmend, setQuotationAsLostAction() (+3 more)

### Community 48 - "actions — CopyFromQuotationPanel"
Cohesion: 0.23
Nodes (10): CopiedQuotationFields, CopyFromQuotationPanel(), ConfirmedLineRow, CopyableQuotation, getQuotationForCopy(), listCopyableQuotations(), QuotationDocForCopy, QuotationForCopy (+2 more)

### Community 49 - "components — PickListLocationsTable"
Cohesion: 0.24
Nodes (8): PickListDoc, PickListLocation, PickListLocationRow, PickListLocationsTable(), EditablePickListLocation, EditorState, PickListPickedQtyEditor(), pickListStatus()

### Community 50 - "sales-partners — actions"
Cohesion: 0.25
Nodes (8): createSalesPartnerAction(), FormState, TEXT_KEYS, toFields(), updateSalesPartnerAction(), EditSalesPartnerPage(), SalesPartnerDoc, NewSalesPartnerPage()

### Community 51 - "batches — actions"
Cohesion: 0.29
Nodes (8): buildBatchFields(), createBatchAction(), FormState, humanizeError(), updateBatchAction(), BatchDoc, EditBatchPage(), NewBatchPage()

### Community 52 - "scripts — CompletedProcess"
Cohesion: 0.40
Nodes (10): CompletedProcess, bench(), docker_exec(), ensure_frontend_has_app(), ensure_hostname_alias(), main(), preflight_check_apps_on_backend(), Fail fast, before creating anything, if this bench has never had 	`bench get-app (+2 more)

### Community 53 - "lib — jspdf"
Cohesion: 0.31
Nodes (8): jspdf, ExportMenu(), csvEscape(), downloadBlob(), exportToCsv(), exportToExcel(), exportToPdf(), jspdf

### Community 54 - "material-requests — actions"
Cohesion: 0.36
Nodes (9): buildMaterialRequestFields(), cancelMaterialRequestAction(), createMaterialRequestAction(), FormState, humanizeError(), MaterialRequestItemInput, parseMaterialRequestItems(), submitMaterialRequestAction() (+1 more)

### Community 55 - "components — SellingSettingsFormShell"
Cohesion: 0.27
Nodes (6): SellingSettingsDoc, DocTab, SellingSettingsFormShell(), SettingsFormState, SettingsFieldGroup(), SettingsFieldSpec

### Community 56 - "serial-nos — actions"
Cohesion: 0.31
Nodes (8): buildSerialNoFields(), createSerialNoAction(), FormState, humanizeError(), updateSerialNoAction(), EditSerialNoPage(), SerialNoDoc, STATUS_OPTIONS

### Community 57 - "frontend — package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 58 - "[name] — DocLink"
Cohesion: 0.25
Nodes (7): JobCardRow, MaterialTransferRow, WorkOrderDetailPage(), WorkOrderDoc, WorkOrderItemRow, WorkOrderOperationRow, workOrderStatus()

### Community 59 - "actions — BatchSerialPicker"
Cohesion: 0.33
Nodes (7): BatchSerialEntry, BatchSerialPicker(), AutoBatchRow, AutoSerialRow, BatchSerialLedgerEntry, getAutoBatchSerialData(), SerialBatchBundleEntry

### Community 60 - "mcp-server — Manufacturing module (apps/frontend)"
Cohesion: 0.36
Nodes (8): Manufacturing module (apps/frontend), apps/mcp-server README, Discovery tools (ping, list_doctypes, get_doctype_fields, list_documents), Manufacturing MCP tools (get_manufacturing_overview, get_work_order_detail, list_work_orders, list_job_cards, get_job_card_detail), Two-tier access model (dev tier vs client tier), inventory-procurement agent, mcp-dev agent, Current Mission Priority Lock

### Community 61 - "create-supplier-quotation — CreateSupplierQuotationForm"
Cohesion: 0.29
Nodes (6): CompanyDoc, CreateSupplierQuotationPage(), RfqForSq, RfqItemForSq, CreateSupplierQuotationForm(), FormState

### Community 62 - "transfer-materials — actions"
Cohesion: 0.43
Nodes (7): buildStockEntryFields(), FormState, humanizeError(), parseTransferRows(), saveTransferDraftAction(), submitTransferAction(), TransferRowInput

### Community 63 - "material-requests — MaterialRequestsPage"
Cohesion: 0.29
Nodes (6): MaterialRequestsPage(), SearchParams, SORT_OPTIONS, STATUS_OPTIONS, MaterialRequestRow, MaterialRequestsTable()

### Community 64 - "purchase-orders — PurchaseOrdersPage"
Cohesion: 0.29
Nodes (6): PurchaseOrdersPage(), SearchParams, SORT_OPTIONS, STATUS_OPTIONS, PurchaseOrderRow, PurchaseOrdersTable()

### Community 65 - "purchase-receipts — PurchaseReceiptsPage"
Cohesion: 0.29
Nodes (6): PurchaseReceiptsPage(), SearchParams, SORT_OPTIONS, STATUS_OPTIONS, PurchaseReceiptRow, PurchaseReceiptsTable()

### Community 66 - "quotations — QuotationsPage"
Cohesion: 0.29
Nodes (6): QuotationsPage(), SearchParams, SORT_OPTIONS, STATUS_OPTIONS, QuotationRow, QuotationsTable()

### Community 67 - "stock-entries — PURPOSE_OPTIONS"
Cohesion: 0.29
Nodes (6): PURPOSE_OPTIONS, SearchParams, SORT_OPTIONS, StockEntriesPage(), StockEntriesTable(), StockEntryRow

### Community 68 - "docs — What's Inside ERPNext (Feature Pack)"
Cohesion: 0.29
Nodes (7): What's Inside ERPNext (Feature Pack), Ceylon Stack Playbook Overview, HR & Payroll — Frappe HR (Separate App), Before You Rebrand — GPL-3.0 Note, ERPNext Platform Reference Overview, Handoff Note for Separate Developer, Licensing Note (GPL-3.0 hrms vs AGPL-3.0 crm/helpdesk/insights)

### Community 69 - "ERP System — ACCESS.md — Server, Repo & Command Reference"
Cohesion: 0.47
Nodes (6): ACCESS.md — Server, Repo & Command Reference, Hetzner Cloud Server (ubuntu-4gb-hel1-4), DevOps Agent, Security Specialist Agent, Deploy Smart Factory Skill, Manual Docker cp + Restart Deploy Stopgap

### Community 70 - "docker — backend/db/queue/scheduler/websocket services"
Cohesion: 0.40
Nodes (6): backend/db/queue/scheduler/websocket services, frontend service (nginx-entrypoint, FRAPPE_SITE_NAME_HEADER), Swarm-mode restart_policy (No-Op under docker compose), Known Open Gaps (Restart Policy, Default Passwords), pwd.yml FRAPPE_SITE_NAME_HEADER Fix (Critical), Operational Scripts (Backup/Deploy/Health Check)

### Community 71 - "lib — route"
Cohesion: 0.60
Nodes (4): POST(), verifyErpNextLogin(), bytesToBase64Url(), signSession()

### Community 72 - "components — PurchaseInvoiceForm"
Cohesion: 0.50
Nodes (3): NewPurchaseInvoicePage(), PurchaseInvoiceForm(), PurchaseInvoiceFormState

### Community 73 - "create-invoice — CreateSalesInvoiceFromSalesOrderPage"
Cohesion: 0.50
Nodes (4): CreateSalesInvoiceFromSalesOrderPage(), SalesOrderForSelection, SalesOrderItemForSelection, getBilledQtyBySoDetail()

### Community 74 - "app — layout"
Cohesion: 0.40
Nodes (3): metadata, plexMono, plexSans

### Community 75 - "decisions — Architecture Decision Records doc"
Cohesion: 0.60
Nodes (5): Architecture Decision Records doc, ADR-002: Keep canonical model independent from Frappe, ADR-004: Migrate native backend domain-by-domain, ADR-005: Use behavioral compatibility tests before migrating any domain, ADR-006: Do not migrate accounting/stock valuation until verified

### Community 77 - "docs — Industries & Fit (8 Sri Lankan Segments)"
Cohesion: 0.50
Nodes (4): Industries & Fit (8 Sri Lankan Segments), Manufacturing Module Reference, What's Relevant to Ceylon Stack v1, Stock (Inventory) Module Reference

### Community 78 - "docs — Discount Logic Comparison"
Cohesion: 0.50
Nodes (4): Discount Logic Comparison, Native vs Gaps Scoping Decision (Phase 1), Quotation Scenarios (ERPNext vs SAP B1 vs Acumatica vs D365), Sales Order Scenarios (Partial Delivery, Backorder, Blanket Orders)

### Community 82 - "controls — Mission Lock Drift Note"
Cohesion: 0.67
Nodes (3): Mission Lock Drift Note, Current Mission (Sept 2026), Module Sequencing Rules

### Community 83 - "docs — Cancellation & Amendment Logic"
Cohesion: 0.67
Nodes (3): Cancellation & Amendment Logic, Universal Document Flow (Lead to Payment), Returns / Credit Notes Comparison

### Community 84 - "docs — Practice Site Setup Steps (bench new-site)"
Cohesion: 0.67
Nodes (3): Practice Site Setup Steps (bench new-site), What To Test on Practice Site, Why a Second Site, Not a Second Server

## Ambiguous Edges - Review These
- `Ceylon Stack Color Tokens (sapphire/cinnamon/tea/turmeric/terracotta)` → `Industrial-Functional Color Palette (graphite/signal/alert/success)`  [AMBIGUOUS]
  docs/brand/package/ceylon-stack-frontend-design.md · relation: semantically_similar_to
- `Brand Guide (Visual Usage Guidelines)` → `Ceylon Stack Brand Guide (Full Package Doc)`  [AMBIGUOUS]
  docs/brand/package/Ceylon-Stack-Brand-Guide.html · relation: semantically_similar_to

## Knowledge Gaps
- **505 isolated node(s):** `python`, `ceylon_services`, `eslintConfig`, `nextConfig`, `name` (+500 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **39 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Ceylon Stack Color Tokens (sapphire/cinnamon/tea/turmeric/terracotta)` and `Industrial-Functional Color Palette (graphite/signal/alert/success)`?**
  _Edge tagged AMBIGUOUS (relation: semantically_similar_to) - confidence is low._
- **What is the exact relationship between `Brand Guide (Visual Usage Guidelines)` and `Ceylon Stack Brand Guide (Full Package Doc)`?**
  _Edge tagged AMBIGUOUS (relation: semantically_similar_to) - confidence is low._
- **Why does `fetchLinkOptions()` connect `Sales Master Data Create Pages` to `Buying Reports Hub`, `Buying & Manufacturing Detail Pages`, `Buying List Pages`, `Manufacturing & Delivery List Pages`, `Sales Dashboard & Charts`, `Cross-Module Detail Pages`, `RFQ & Campaign Create Flows`, `Purchase Order Actions`, `List Pages (Filters & Sort)`, `New Document Create Pages`, `Stock Balance Page`, `suppliers — SupplierForm`, `work-orders — actions`, `customers — CustomerForm`, `addresses — actions`, `items — ItemForm`, `sales-partners — actions`, `batches — actions`, `components — SellingSettingsFormShell`, `serial-nos — actions`, `create-supplier-quotation — CreateSupplierQuotationForm`, `material-requests — MaterialRequestsPage`, `purchase-orders — PurchaseOrdersPage`, `purchase-receipts — PurchaseReceiptsPage`, `quotations — QuotationsPage`, `stock-entries — PURPOSE_OPTIONS`, `components — PurchaseInvoiceForm`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Why does `dependencies` connect `frontend — jspdf-autotable` to `frontend — package.json`, `lib — jspdf`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `frontend — eslint` to `frontend — package.json`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **What connects `python`, `ceylon_services`, `eslintConfig` to the rest of the system?**
  _505 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Buying Reports Hub` be split into smaller, more focused modules?**
  _Cohesion score 0.052943354313217325 - nodes in this community are weakly interconnected._