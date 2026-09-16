# Graph Report - .  (2026-09-16)

## Corpus Check
- Large corpus: 431 files · ~542,895 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 1534 nodes · 4349 edges · 148 communities (96 shown, 52 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 70 edges (avg confidence: 0.79)
- Token cost: 480,045 input · 0 output

## Community Hubs (Navigation)
- Buying Reports & Analytics Pages
- Party Master Data Pages
- Buying Document Detail Pages
- Party Master Server Actions
- Party Master List Pages
- Shared Data Table Components
- Binding Governance Docs & Agent Roster
- Purchase Invoice Server Actions
- Cross-Document Creation Flows
- App Shell Layout & Navigation
- Delivery Note Server Actions
- Sales/Buying Detail Pages
- MCP Server Config & ERPNext Client
- Ceylon Stack Brand System Docs
- Sales Home Dashboard & Flow Map
- Buying List Pages
- Sales Invoice Server Actions
- Frontend TypeScript Config
- Purchase Order Server Actions
- Sales Order Server Actions
- Buying Relationship Map & Status Helpers
- Smart Factory App & Headless Architecture
- Stock Entry Server Actions
- RFQ/Campaign/Contact Create-Edit Pages
- ERPNext API Client Library
- Purchase Receipt & RFQ Server Actions
- Selling Settings Form
- Frontend Dev Dependencies
- Sales List Pages & Access Control
- Sales Order Copy-From-Quotation Panel
- Apps / Frontend (misc)
- Buying / Suppliers (misc)
- Sales / Customers (misc)
- Src / Lib (misc)
- Src / Components (misc)
- Sales / Items (misc)
- Apps / Mcp-Server (misc)
- Src / Components (misc)
- Sales / Orders (misc)
- Sales / Quotations (misc)
- Src / Components (misc)
- Src / Components (misc)
- Infra / Scripts (misc)
- Progress (misc)
- Buying / Material-Requests (misc)
- Src / Components (misc)
- Progress (misc)
- Docs (misc)
- Apps / Ceylon Services (misc)
- Apps / Frontend (misc)
- Src / Lib (misc)
- Apps / Frontend (misc)
- Buying / Supplier-Quotations (misc)
- Apps / Smart Factory (misc)
- Buying / Purchase-Invoices (misc)
- Buying / Purchase-Orders (misc)
- Buying / Purchase-Receipts (misc)
- [Name] / Create-Supplier-Quotation (misc)
- Buying / Supplier-Quotations (misc)
- Sales / Quotations (misc)
- Stock / Stock-Entries (misc)
- [Name] / Set-As-Lost (misc)
- Stock / Batches (misc)
- Stock / Warehouses (misc)
- Src / Components (misc)
- Src / Components (misc)
- Progress (misc)
- Infra / Docker (misc)
- Src / Lib (misc)
- Src / Components (misc)
- Src / App (misc)
- Development System Rules (misc)
- Design (misc)
- App / (App) (misc)
- Docs (misc)
- Ceylon Services / Ceylon Services (misc)
- Ceylon Services / Ceylon Services (misc)
- Claude (misc)
- Docs (misc)
- .Mcp (misc)
- Apps / Ceylon Services (misc)
- Apps / Frontend (misc)
- Apps / Frontend (misc)
- Apps / Frontend (misc)
- Apps / Frontend (misc)
- Apps / Frontend (misc)
- Development System Rules (misc)
- Docs / Brand (misc)
- Infra / Scripts (misc)
- Infra / Scripts (misc)
- Ceylon Services / Ceylon Services (misc)
- Ceylon Services / Ceylon Services (misc)
- Apps / Frontend (misc)
- Apps / Frontend (misc)
- Claude (misc)
- Claude (misc)
- Design (misc)
- Design (misc)
- Design (misc)
- Development System Rules (misc)
- Development System Rules (misc)
- Docs (misc)
- Docs / Brand (misc)
- Brand / Package (misc)
- Docs (misc)
- Docs (misc)
- Docs (misc)
- Docs (misc)
- Docs (misc)
- Docs (misc)
- Docs (misc)
- Docs (misc)
- Docs (misc)
- Docs (misc)
- Docs (misc)
- Docs (misc)
- Docs (misc)
- Docs (misc)
- Frontend Guide (misc)
- Frontend Guide (misc)
- Frontend Guide (misc)
- Frontend Guide (misc)
- Apps / Ceylon Services (misc)
- Apps / Smart Factory (misc)
- Plan (misc)
- Plan (misc)
- Plan (misc)
- Progress (misc)

## God Nodes (most connected - your core abstractions)
1. `fetchLinkOptions()` - 131 edges
2. `listDocs()` - 77 edges
3. `getDoc()` - 68 edges
4. `ErpNextError` - 66 edges
5. `getCount()` - 58 edges
6. `parsePage()` - 57 edges
7. `parsePageSize()` - 57 edges
8. `paginate()` - 57 edges
9. `updateDoc()` - 54 edges
10. `listItemOptions()` - 37 edges

## Surprising Connections (you probably didn't know these)
- `Architecture Rules (Non-Negotiable, headless only)` --semantically_similar_to--> `Frontend Architecture Rules (Do Not Break)`  [INFERRED] [semantically similar]
  DEVELOPMENT_SYSTEM_RULES.md → FRONTEND_GUIDE.md
- `Module Sequencing Rules (Sales->Inventory->Buying->Manufacturing->Accounting)` --semantically_similar_to--> `Module Priority Order (Sales/Buying/Stock/Manufacturing/Accounting/Dashboard)`  [INFERRED] [semantically similar]
  DEVELOPMENT_SYSTEM_RULES.md → FRONTEND_GUIDE.md
- `API Layer Rules (lib/erpnext.ts)` --semantically_similar_to--> `mcp-server Overview (Ceylon Stack Developer MCP)`  [INFERRED] [semantically similar]
  FRONTEND_GUIDE.md → apps/mcp-server/README.md
- `Week 3-4: Learn & Extend Inside ERPNext` --conceptually_related_to--> `smart_factory app created - full Desk branding pass (2026-09-12)`  [INFERRED]
  PLAN.md → PROGRESS.md
- `Architecture Summary (layered stack + costs)` --conceptually_related_to--> `Headless Architecture (core design decision)`  [INFERRED]
  PLAN.md → CLAUDE.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Binding Governance Documents Set** — development_system_rules, agent_operating_guide, agent_usage_policy, frontend_guide [EXTRACTED 1.00]
- **Control Agents (Highest Authority Tier)** — claude_agents_code_reviewer, claude_agents_qa_tester, claude_agents_release_tracker [EXTRACTED 1.00]
- **Execution Agents (Implementation Tier)** — claude_agents_frontend_dev, claude_agents_frappe_dev, claude_agents_inventory_procurement, claude_agents_manufacturing_floor, claude_agents_devops, claude_agents_product_designer [EXTRACTED 1.00]
- **Apps Forming the Headless Architecture (talk to ERPNext only via REST API)** — claude_smart_factory_app, apps_frontend_readme_overview, apps_mes_service_readme_overview, apps_mcp_server_readme_overview, apps_ceylon_services_readme_app_overview [INFERRED 0.85]
- **Binding Control Documents Governing All Repo Work** — claude_binding_control_documents, development_system_rules_architecture_rules, frontend_guide_architecture_rules [EXTRACTED 1.00]
- **Recurring Infra Gotchas Baked Into deploy-smart-factory Skill** — progress_frontend_backend_filesystem_split_gotcha, progress_gunicorn_editable_install_gotcha, progress_pwd_yml_single_site_bug, progress_devops_subagent_deploy_skill [INFERRED 0.85]
- **Competing Ceylon Stack Color Token Systems** — docs_brand_md_color_tokens, docs_brand_ceylon_stack_branding_color_palette, docs_brand_package_ceylon_stack_frontend_design_color_palette [INFERRED 0.75]
- **Sales Module Gap-Closing Plan (4 Phases)** — docs_ceylon_stack_sales_scenarios_native_vs_gaps, docs_ceylon_stack_documentation_sales_documents, docs_ceylon_stack_documentation_partial_fulfillment, docs_ceylon_stack_documentation_roadmap_sales [INFERRED 0.85]
- **MCP Agent Roster Across Docs** — docs_ceylon_stack_playbook_agent_roster, docs_mcp_agents_plan_phase2_agents, docs_ceylon_stack_documentation_roadmap_agents [INFERRED 0.85]

## Communities (148 total, 52 thin omitted)

### Community 0 - "Buying Reports & Analytics Pages"
Cohesion: 0.05
Nodes (53): DOC_TYPES, PurchaseAnalyticsPage(), RANGES, SearchParams, TREE_TYPES, VALUE_QUANTITY, BuyingSimpleReportPage(), SearchParams (+45 more)

### Community 1 - "Party Master Data Pages"
Cohesion: 0.08
Nodes (41): CreateSupplierQuotationPage(), ADDRESS_TYPES, AddressDoc, EditAddressPage(), NewAddressPage(), fields, fields, CustomerGroupDoc (+33 more)

### Community 2 - "Buying Document Detail Pages"
Cohesion: 0.13
Nodes (35): MaterialRequestDoc, PurchaseInvoiceDoc, PurchaseOrderDoc, PurchaseReceiptDoc, RfqDoc, SupplierQuotationDoc, DeliveryNoteDoc, SalesInvoiceDoc (+27 more)

### Community 3 - "Party Master Server Actions"
Cohesion: 0.08
Nodes (52): CHECKBOX_KEYS, createAddressAction(), FormState, TEXT_KEYS, updateAddressAction(), validate(), createCampaignAction(), FormState (+44 more)

### Community 4 - "Party Master List Pages"
Cohesion: 0.14
Nodes (44): SuppliersPage(), AddressesPage(), AddressRow, CampaignRow, CampaignsPage(), ContactRow, ContactsPage(), CustomerGroupRow (+36 more)

### Community 5 - "Shared Data Table Components"
Cohesion: 0.11
Nodes (36): ColumnPicker(), columns, DataTable(), columns, columns, columns, columns, ProgressBar() (+28 more)

### Community 6 - "Binding Governance Docs & Agent Roster"
Cohesion: 0.17
Nodes (46): ACCESS.md — Server, Repo & Command Reference, Hetzner Cloud Server (ubuntu-4gb-hel1-4), Ceylon Stack Agent Operating Guide, Current Mission Priority Lock (Sales → Inventory MVP → Buying → Manufacturing locked), Definition of Ready (agent acceptance standard), Ceylon Stack Agent Usage Policy, Next.js Frontend Dashboard App, MCP Server App (+38 more)

### Community 7 - "Purchase Invoice Server Actions"
Cohesion: 0.08
Nodes (35): buildInvoiceItemFromPurchaseOrder(), buildInvoiceItemFromPurchaseReceipt(), buildPurchaseInvoiceFields(), cancelPurchaseInvoiceAction(), createPurchaseInvoiceAction(), createPurchaseInvoiceFromPurchaseOrder(), createPurchaseInvoiceFromPurchaseOrderAction(), createPurchaseInvoiceFromPurchaseReceipt() (+27 more)

### Community 8 - "Cross-Document Creation Flows"
Cohesion: 0.08
Nodes (24): PurchaseOrderForSelection, PurchaseOrderItemForSelection, CreateDeliveryNoteFromSalesOrderPage(), SalesOrderForSelection, SalesOrderItemForSelection, CreatePickListFromSalesOrderPage(), SalesOrderForSelection, SalesOrderItemForSelection (+16 more)

### Community 9 - "App Shell Layout & Navigation"
Cohesion: 0.09
Nodes (29): AppLayout(), FullscreenToggle(), activeModuleStore, BUYING_NAV_GROUPS, DashboardLink(), DEFAULT_STATE, findActiveGroupId(), isItemActive() (+21 more)

### Community 10 - "Delivery Note Server Actions"
Cohesion: 0.10
Nodes (32): attachBatchSerialBundles(), BatchSerialAttachInput, buildDeliveryNoteFields(), cancelDeliveryNoteAction(), createDeliveryNoteAction(), createDeliveryNoteFromSalesOrderAction(), FormState, humanizeError() (+24 more)

### Community 11 - "Sales/Buying Detail Pages"
Cohesion: 0.16
Nodes (32): MaterialRequestDetailPage(), PurchaseInvoiceDetailPage(), PurchaseOrderDetailPage(), PurchaseReceiptDetailPage(), RfqDetailPage(), SupplierQuotationDetailPage(), DeliveryNoteDetailPage(), SalesInvoiceDetailPage() (+24 more)

### Community 12 - "MCP Server Config & ERPNext Client"
Cohesion: 0.10
Nodes (24): Config, load_config(), Configuration loading for the Ceylon Stack ERPNext MCP server., Load and validate required ERPNext connection settings.      Raises RuntimeError, ERPNextClient, ERPNextError, _extract_error(), _json() (+16 more)

### Community 13 - "Ceylon Stack Brand System Docs"
Cohesion: 0.06
Nodes (33): Applied Dashboard UI Preview, Export-Ledger Color Palette (Sapphire/Tea/Turmeric/Terracotta), Gem-Stack Mark & Lockups, Why 'Ceylon Stack' (Naming Rationale), Ceylon Stack Color Tokens (sapphire/cinnamon/tea/turmeric/terracotta), Ceylon Stack Naming & Positioning Line, Web Favicon/Manifest Integration Snippet, Brand Guide (Visual Usage Guidelines) (+25 more)

### Community 14 - "Sales Home Dashboard & Flow Map"
Cohesion: 0.11
Nodes (24): formatCurrencyCard(), SalesHomePage(), formatK(), LineChart(), chipWidth(), SalesFlowMap(), SCENE_ORDER, relatedNodes() (+16 more)

### Community 15 - "Buying List Pages"
Cohesion: 0.09
Nodes (25): MaterialRequestsPage(), SearchParams, SORT_OPTIONS, STATUS_OPTIONS, RequestForQuotationsPage(), SearchParams, SORT_OPTIONS, DeliveryNotesPage() (+17 more)

### Community 16 - "Sales Invoice Server Actions"
Cohesion: 0.12
Nodes (26): CreateSalesInvoiceFromDeliveryNotePage(), DeliveryNoteForSelection, DeliveryNoteItemForSelection, buildInvoiceItem(), buildInvoiceItemFromDeliveryNote(), buildSalesInvoiceFields(), bulkCreateSalesInvoicesFromOrdersAction(), cancelSalesInvoiceAction() (+18 more)

### Community 17 - "Frontend TypeScript Config"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 18 - "Purchase Order Server Actions"
Cohesion: 0.14
Nodes (21): buildPurchaseOrderFields(), cancelPurchaseOrderAction(), createPurchaseOrderAction(), createPurchaseOrderFromSupplierQuotationAction(), FormState, humanizeError(), parsePurchaseOrderItems(), PurchaseOrderItemInput (+13 more)

### Community 19 - "Sales Order Server Actions"
Cohesion: 0.15
Nodes (21): buildSalesOrderFields(), cancelSalesOrderAction(), createSalesOrderAction(), createSalesOrderFromQuotationAction(), FormState, humanizeError(), QuotationForOrder, QuotationItemForOrder (+13 more)

### Community 20 - "Buying Relationship Map & Status Helpers"
Cohesion: 0.16
Nodes (22): buildNode(), dedupeRefs(), DocRef, findRoots(), getChildren(), HREF_BASE, keyOf(), loadNodeData() (+14 more)

### Community 21 - "Smart Factory App & Headless Architecture"
Cohesion: 0.09
Nodes (24): Smart Factory Module Declaration, Smart Factory Patches Config, Data Flow (MQTT to Frontend), frontend (dashboards, digital twin), Headless Architecture Decision, Layered View (Shop Floor to Analytics), mcp-server (ERPNext API tool wrapper), mes-service (MQTT to OEE calc) (+16 more)

### Community 22 - "Stock Entry Server Actions"
Cohesion: 0.16
Nodes (18): attachBatchSerialBundles(), buildStockEntryFields(), cancelStockEntryAction(), createStockEntryAction(), FormState, humanizeError(), Purpose, PURPOSES (+10 more)

### Community 23 - "RFQ/Campaign/Contact Create-Edit Pages"
Cohesion: 0.12
Nodes (13): CreateRfqFromMaterialRequestPage(), MaterialRequestForRfq, MaterialRequestItemForRfq, CampaignDoc, fields, ContactDoc, fields, buildSerialNoFields() (+5 more)

### Community 24 - "ERPNext API Client Library"
Cohesion: 0.16
Nodes (17): addComment(), callMethodWithResult(), deleteDoc(), DocInfoComment, DocInfoLabel, DocInfoVersion, erpnextFetch(), extractErpNextMessage() (+9 more)

### Community 25 - "Purchase Receipt & RFQ Server Actions"
Cohesion: 0.18
Nodes (16): cancelPurchaseReceiptAction(), createPurchaseReceiptFromPurchaseOrderAction(), FormState, humanizeError(), PurchaseOrderForReceipt, PurchaseOrderItemForReceipt, submitPurchaseReceiptAction(), cancelRfqAction() (+8 more)

### Community 26 - "Selling Settings Form"
Cohesion: 0.13
Nodes (13): SellingSettingsDoc, DocTab, SellingSettingsFormShell(), SettingsFormState, SettingsFieldGroup(), SettingsFieldSpec, FIELD_LABEL_OVERRIDES, humanizeField() (+5 more)

### Community 27 - "Frontend Dev Dependencies"
Cohesion: 0.12
Nodes (17): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+9 more)

### Community 28 - "Sales List Pages & Access Control"
Cohesion: 0.14
Nodes (13): SalesInvoicesPage(), SearchParams, SORT_OPTIONS, STATUS_OPTIONS, PickListsPage(), SearchParams, SORT_OPTIONS, STATUS_OPTIONS (+5 more)

### Community 29 - "Sales Order Copy-From-Quotation Panel"
Cohesion: 0.17
Nodes (13): CopiedQuotationFields, CopyFromQuotationPanel(), ConfirmedLineRow, ORDER_TYPES, SalesOrderForm(), SalesOrderFormState, CopyableQuotation, getQuotationForCopy() (+5 more)

### Community 30 - "Apps / Frontend (misc)"
Cohesion: 0.13
Nodes (15): dependencies, jspdf-autotable, lucide-react, next, react, react-dom, server-only, xlsx (+7 more)

### Community 31 - "Buying / Suppliers (misc)"
Cohesion: 0.24
Nodes (10): createSupplierAction(), fieldsFromForm(), FormState, humanizeError(), updateSupplierAction(), EditSupplierPage(), SupplierDoc, NewSupplierPage() (+2 more)

### Community 32 - "Sales / Customers (misc)"
Cohesion: 0.24
Nodes (10): createCustomerAction(), fieldsFromForm(), FormState, humanizeError(), updateCustomerAction(), CustomerDoc, EditCustomerPage(), NewCustomerPage() (+2 more)

### Community 33 - "Src / Lib (misc)"
Cohesion: 0.19
Nodes (9): StockEntryDetailPage(), StockEntryDoc, summarizeBatchSerialEntries(), getSerialBatchBundleEntries(), stockEntryStatus(), base64UrlToBytes(), encoder, getKey() (+1 more)

### Community 34 - "Src / Components (misc)"
Cohesion: 0.21
Nodes (8): NewMaterialRequestPage(), NewDeliveryNotePage(), DeliveryNoteForm(), DeliveryNoteFormState, MaterialRequestForm(), MaterialRequestFormState, getItemLineDefaults(), ItemLineDefaults

### Community 35 - "Sales / Items (misc)"
Cohesion: 0.27
Nodes (8): createItemAction(), FormState, humanizeError(), updateItemAction(), EditItemPage(), ItemDoc, NewItemPage(), ItemForm()

### Community 36 - "Apps / Mcp-Server (misc)"
Cohesion: 0.17
Nodes (12): Auth Model: Service-Account Proxy, mcp-server Overview (Ceylon Stack Developer MCP), Business Tools Gated Behind Phase 0 Walkthrough, MCP Tools (ping, list_doctypes, get_doctype_fields, list_documents), Two-Tier Access Model (dev tier vs client tier), mcp-server Python Dependencies (mcp, httpx, python-dotenv), mes-service Overview (FastAPI real-time MES/OEE core), API Layer Rules (lib/erpnext.ts) (+4 more)

### Community 37 - "Src / Components (misc)"
Cohesion: 0.24
Nodes (8): NewSalesInvoicePage(), DiscountFields(), LineRow, ORDER_TYPES, QuotationFormState, SalesInvoiceForm(), SalesInvoiceFormState, ItemOption

### Community 38 - "Sales / Orders (misc)"
Cohesion: 0.18
Nodes (11): bulkCloseSalesOrdersAction(), bulkReopenSalesOrdersAction(), ADVANCE_PAYMENT_STATUS_OPTIONS, BILLING_STATUS_OPTIONS, DELIVERY_STATUS_OPTIONS, SalesOrdersPage(), SearchParams, SORT_OPTIONS (+3 more)

### Community 39 - "Sales / Quotations (misc)"
Cohesion: 0.30
Nodes (11): amendQuotationAction(), buildQuotationFields(), cancelQuotationAction(), createQuotationAction(), FormState, humanizeError(), QuotationForAmend, setQuotationAsLostAction() (+3 more)

### Community 40 - "Src / Components (misc)"
Cohesion: 0.24
Nodes (8): PickListDoc, PickListLocation, PickListLocationRow, PickListLocationsTable(), EditablePickListLocation, EditorState, PickListPickedQtyEditor(), pickListStatus()

### Community 41 - "Src / Components (misc)"
Cohesion: 0.27
Nodes (9): batchSerialTotal(), emptyRow, hasPricingRule(), LineItemsEditor(), pricingRuleSummary(), PricingContext, PricingResolution, PricingRuleApiItem (+1 more)

### Community 42 - "Infra / Scripts (misc)"
Cohesion: 0.40
Nodes (10): CompletedProcess, bench(), docker_exec(), ensure_frontend_has_app(), ensure_hostname_alias(), main(), preflight_check_apps_on_backend(), Fail fast, before creating anything, if this bench has never had 	`bench get-app (+2 more)

### Community 43 - "Progress (misc)"
Cohesion: 0.22
Nodes (11): Brand Rollout Order (Desk -> smart_factory -> frontend -> docs), DevOps Claude Code Subagent + Deploy Skill (2026-09-12), ERPNext Desk Rebrand - settings-only pass, Frontend/Backend Container Filesystem Split Gotcha, Full Agent Roster: dev, UI/UX, implementation teams (2026-09-12), Gunicorn Workers Don't Pick Up New Editable Installs Gotcha, Real Brand Asset Swap - Desk Rebrand (2026-09-12), Server Incident - 2026-09-12 reboot (+3 more)

### Community 44 - "Buying / Material-Requests (misc)"
Cohesion: 0.36
Nodes (9): buildMaterialRequestFields(), cancelMaterialRequestAction(), createMaterialRequestAction(), FormState, humanizeError(), MaterialRequestItemInput, parseMaterialRequestItems(), submitMaterialRequestAction() (+1 more)

### Community 45 - "Src / Components (misc)"
Cohesion: 0.27
Nodes (7): NewStockEntryPage(), Purpose, PURPOSES, StockEntryForm(), StockEntryFormState, getStockDefaults(), StockDefaults

### Community 46 - "Progress (misc)"
Cohesion: 0.20
Nodes (10): Hetzner Cloud Infrastructure, Why Hetzner and not Oracle Cloud, Performance Guidelines (10-15 concurrent users), Week 1-2: Foundation - Stand Up ERPNext, ERPNext Deployment (frappe_docker pwd.yml), apps/frontend Scaffolded & Rebranded (create-next-app), Hetzner Cloud Provisioning (CX23), Oracle Cloud Hosting Attempt (abandoned) (+2 more)

### Community 47 - "Docs (misc)"
Cohesion: 0.20
Nodes (10): Frontend Buying Module (Building), Frontend Inventory/Stock Module (Live), Partial Fulfillment & Copy From Quotation, Manufacturing & OEE Roadmap (Building), Sales Module — Next Phases (Roadmap), Sales Documents (Quotation/SO/SI/Delivery Note/Pick&Pack), Discount Logic Comparison, Native vs Gaps Scoping Decision (Phase 1) (+2 more)

### Community 48 - "Apps / Ceylon Services (misc)"
Cohesion: 0.25
Nodes (9): ceylon_services Proprietary License, apps/frontend Overview (Next.js Desk replacement), smart_factory Proprietary License, Next.js Frontend (apps/frontend), Headless Architecture (core design decision), Real-time IoT/MES Layer, AGPL-3.0 License Risk for CRM/Helpdesk/Insights (corrected 2026-09-13), Architecture Summary (layered stack + costs) (+1 more)

### Community 49 - "Apps / Frontend (misc)"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 50 - "Src / Lib (misc)"
Cohesion: 0.36
Nodes (7): jspdf, csvEscape(), downloadBlob(), exportToCsv(), exportToExcel(), exportToPdf(), jspdf

### Community 51 - "Apps / Frontend (misc)"
Cohesion: 0.28
Nodes (9): What's Built (Phases 1-3, tabs/connections), release-tracker Subagent Ground Rule, Buying Module - Next Focus (§10), Stock Module - Current Focus (§10a), apps/frontend build: Phases 1-3 (Sales module, 2026-09-13), apps/frontend build: Inventory (Stock) module (2026-09-16), Inventory MVP Package Closeout (2026-09-16), Stock Module Review+QA - Serial/Batch Outward Bug Fix (+1 more)

### Community 52 - "Buying / Supplier-Quotations (misc)"
Cohesion: 0.33
Nodes (8): cancelSupplierQuotationAction(), createSupplierQuotationFromRfqAction(), FormState, humanizeError(), SourceRfq, SourceRfqItem, submitSupplierQuotationAction(), parseLineRows()

### Community 53 - "Apps / Smart Factory (misc)"
Cohesion: 0.33
Nodes (7): Ceylon Services App Overview, Local Dev Notes (pre-pull placeholder history), smart_factory App Overview (Desk theming now, Manufacturing/OEE later), smart_factory Frappe App, Week 3-4: Learn & Extend Inside ERPNext, App Branches Mechanism (git subtree split, sync-app-branch.sh), Repository Layout (monorepo)

### Community 54 - "Buying / Purchase-Invoices (misc)"
Cohesion: 0.29
Nodes (6): PurchaseInvoicesPage(), SearchParams, SORT_OPTIONS, STATUS_OPTIONS, PurchaseInvoiceRow, PurchaseInvoicesTable()

### Community 55 - "Buying / Purchase-Orders (misc)"
Cohesion: 0.29
Nodes (6): PurchaseOrdersPage(), SearchParams, SORT_OPTIONS, STATUS_OPTIONS, PurchaseOrderRow, PurchaseOrdersTable()

### Community 56 - "Buying / Purchase-Receipts (misc)"
Cohesion: 0.29
Nodes (6): PurchaseReceiptsPage(), SearchParams, SORT_OPTIONS, STATUS_OPTIONS, PurchaseReceiptRow, PurchaseReceiptsTable()

### Community 57 - "[Name] / Create-Supplier-Quotation (misc)"
Cohesion: 0.33
Nodes (5): CompanyDoc, RfqForSq, RfqItemForSq, CreateSupplierQuotationForm(), FormState

### Community 58 - "Buying / Supplier-Quotations (misc)"
Cohesion: 0.29
Nodes (6): SearchParams, SORT_OPTIONS, STATUS_OPTIONS, SupplierQuotationsPage(), SupplierQuotationRow, SupplierQuotationsTable()

### Community 59 - "Sales / Quotations (misc)"
Cohesion: 0.29
Nodes (6): QuotationsPage(), SearchParams, SORT_OPTIONS, STATUS_OPTIONS, QuotationRow, QuotationsTable()

### Community 60 - "Stock / Stock-Entries (misc)"
Cohesion: 0.29
Nodes (6): PURPOSE_OPTIONS, SearchParams, SORT_OPTIONS, StockEntriesPage(), StockEntriesTable(), StockEntryRow

### Community 61 - "[Name] / Set-As-Lost (misc)"
Cohesion: 0.40
Nodes (4): QuotationForLost, SetQuotationAsLostPage(), FormState, SetQuotationLostForm()

### Community 62 - "Stock / Batches (misc)"
Cohesion: 0.60
Nodes (5): buildBatchFields(), createBatchAction(), FormState, humanizeError(), updateBatchAction()

### Community 63 - "Stock / Warehouses (misc)"
Cohesion: 0.60
Nodes (5): buildWarehouseFields(), createWarehouseAction(), FormState, humanizeError(), updateWarehouseAction()

### Community 64 - "Src / Components (misc)"
Cohesion: 0.40
Nodes (4): CreateRfqForm(), FormState, ItemForDisplay, SupplierMultiSelect()

### Community 65 - "Src / Components (misc)"
Cohesion: 0.33
Nodes (3): DOCTYPE_ICON, RelationshipMap(), RelationshipNode

### Community 66 - "Progress (misc)"
Cohesion: 0.33
Nodes (6): Risk Control Rules (Scope creep, Pattern drift, Foundation skipped), Product Portfolio (whitelabel Frappe app ecosystem), ceylon_services App Built + gym-demo Site Created, Product Portfolio: Frappe HR added (2026-09-13), gym-demo Setup Wizard Never Completed - Fix, pwd.yml Silently Single-Site Only - found and fixed 2026-09-13

### Community 67 - "Infra / Docker (misc)"
Cohesion: 0.40
Nodes (6): backend/db/queue/scheduler/websocket services, frontend service (nginx-entrypoint, FRAPPE_SITE_NAME_HEADER), Swarm-mode restart_policy (No-Op under docker compose), Known Open Gaps (Restart Policy, Default Passwords), pwd.yml FRAPPE_SITE_NAME_HEADER Fix (Critical), Operational Scripts (Backup/Deploy/Health Check)

### Community 68 - "Src / Lib (misc)"
Cohesion: 0.60
Nodes (4): POST(), verifyErpNextLogin(), bytesToBase64Url(), signSession()

### Community 69 - "Src / Components (misc)"
Cohesion: 0.50
Nodes (3): NewPurchaseInvoicePage(), PurchaseInvoiceForm(), PurchaseInvoiceFormState

### Community 70 - "Src / App (misc)"
Cohesion: 0.40
Nodes (3): metadata, plexMono, plexSans

### Community 71 - "Development System Rules (misc)"
Cohesion: 0.50
Nodes (5): Binding Control Documents (4 governance docs), Architecture Rules (Non-Negotiable, headless only), Quality Gates (Definition of Ready), Frontend Architecture Rules (Do Not Break), Definition of Done (per document)

### Community 72 - "Design (misc)"
Cohesion: 0.40
Nodes (5): Ceylon Stack (product name), Ceylon Stack Naming & Positioning, Ceylon Stack Color Tokens (sapphire/cinnamon/tea/turmeric/terracotta), Typography (Fraunces/Archivo/IBM Plex), Branding & UX Rules (§12)

### Community 74 - "Docs (misc)"
Cohesion: 0.50
Nodes (4): Industries & Fit (8 Sri Lankan Segments), Manufacturing Module Reference, What's Relevant to Ceylon Stack v1, Stock (Inventory) Module Reference

### Community 78 - "Claude (misc)"
Cohesion: 1.00
Nodes (3): Current Mission Priority Lock (Sales->Inventory->Buying->Manufacturing), Module Sequencing Rules (Sales->Inventory->Buying->Manufacturing->Accounting), Module Priority Order (Sales/Buying/Stock/Manufacturing/Accounting/Dashboard)

### Community 79 - "Docs (misc)"
Cohesion: 0.67
Nodes (3): Cancellation & Amendment Logic, Universal Document Flow (Lead to Payment), Returns / Credit Notes Comparison

## Ambiguous Edges - Review These
- `Ceylon Stack Color Tokens (sapphire/cinnamon/tea/turmeric/terracotta)` → `Industrial-Functional Color Palette (graphite/signal/alert/success)`  [AMBIGUOUS]
  docs/brand/package/ceylon-stack-frontend-design.md · relation: semantically_similar_to
- `Brand Guide (Visual Usage Guidelines)` → `Ceylon Stack Brand Guide (Full Package Doc)`  [AMBIGUOUS]
  docs/brand/package/Ceylon-Stack-Brand-Guide.html · relation: semantically_similar_to

## Knowledge Gaps
- **488 isolated node(s):** `python`, `ceylon_services`, `eslintConfig`, `nextConfig`, `name` (+483 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **52 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Ceylon Stack Color Tokens (sapphire/cinnamon/tea/turmeric/terracotta)` and `Industrial-Functional Color Palette (graphite/signal/alert/success)`?**
  _Edge tagged AMBIGUOUS (relation: semantically_similar_to) - confidence is low._
- **What is the exact relationship between `Brand Guide (Visual Usage Guidelines)` and `Ceylon Stack Brand Guide (Full Package Doc)`?**
  _Edge tagged AMBIGUOUS (relation: semantically_similar_to) - confidence is low._
- **Why does `fetchLinkOptions()` connect `Party Master Data Pages` to `Buying Reports & Analytics Pages`, `Buying Document Detail Pages`, `Sales/Buying Detail Pages`, `Sales Home Dashboard & Flow Map`, `Buying List Pages`, `Purchase Order Server Actions`, `Sales Order Server Actions`, `RFQ/Campaign/Contact Create-Edit Pages`, `Selling Settings Form`, `Sales List Pages & Access Control`, `Buying / Suppliers (misc)`, `Sales / Customers (misc)`, `Src / Components (misc)`, `Sales / Items (misc)`, `Src / Components (misc)`, `Sales / Orders (misc)`, `Buying / Purchase-Invoices (misc)`, `Buying / Purchase-Orders (misc)`, `Buying / Purchase-Receipts (misc)`, `[Name] / Create-Supplier-Quotation (misc)`, `Buying / Supplier-Quotations (misc)`, `Sales / Quotations (misc)`, `Stock / Stock-Entries (misc)`, `[Name] / Set-As-Lost (misc)`, `Src / Components (misc)`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Apps / Frontend (misc)` to `Apps / Frontend (misc)`, `Src / Lib (misc)`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Frontend Dev Dependencies` to `Apps / Frontend (misc)`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **What connects `python`, `ceylon_services`, `eslintConfig` to the rest of the system?**
  _488 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Buying Reports & Analytics Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.05189189189189189 - nodes in this community are weakly interconnected._