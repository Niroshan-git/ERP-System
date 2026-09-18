# Graph Report - D:/_07_ERP/ERP System  (2026-09-18)

## Corpus Check
- 27 files · ~0 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1631 nodes · 4390 edges · 139 communities (97 shown, 42 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 59 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67
- Community 68
- Community 69
- Community 70
- Community 71
- Community 72
- Community 73
- Community 74
- Community 75
- Community 76
- Community 77
- Community 78
- Community 79
- Community 81
- Community 82
- Community 83
- Community 84
- Community 86
- Community 87
- Community 88
- Community 89
- Community 90
- Community 91
- Community 93
- Community 94
- Community 95
- Community 96
- Community 101
- Community 102
- Community 107
- Community 117
- Community 118
- Community 119
- Community 120
- Community 121
- Community 122
- Community 123
- Community 124
- Community 125
- Community 126
- Community 127
- Community 128
- Community 129
- Community 130
- Community 131
- Community 132
- Community 133
- Community 134
- Community 135
- Community 136
- Community 137
- Community 138

## God Nodes (most connected - your core abstractions)
1. `fetchLinkOptions()` - 123 edges
2. `listDocs()` - 72 edges
3. `ErpNextError` - 64 edges
4. `getDoc()` - 64 edges
5. `getCount()` - 54 edges
6. `parsePage()` - 53 edges
7. `parsePageSize()` - 53 edges
8. `paginate()` - 53 edges
9. `updateDoc()` - 48 edges
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

## Communities (139 total, 42 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (116): MaterialRequestsPage(), SearchParams, SORT_OPTIONS, STATUS_OPTIONS, PurchaseInvoicesPage(), SearchParams, SORT_OPTIONS, STATUS_OPTIONS (+108 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (60): ColumnPicker(), columns, CustomerRow, CustomersTable(), DataTable(), columns, columns, MaterialRequestRow (+52 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (59): Architecture Decision Records, Canonical Mapping Standard, Canonical Model Layer Stack, FRAPPE_CURRENT_BEHAVIOR tag, FRAPPE_ONLY_IMPLEMENTATION_DETAIL tag, REQUIRED_CEYLON_BEHAVIOR tag, Two Backends, One Product, Job Card (read-only fields) (+51 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (32): CreateRfqFromMaterialRequestPage(), MaterialRequestForRfq, MaterialRequestItemForRfq, ADDRESS_TYPES, AddressDoc, EditAddressPage(), NewAddressPage(), CampaignDoc (+24 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (44): CHECKBOX_KEYS, createAddressAction(), FormState, TEXT_KEYS, updateAddressAction(), validate(), createCampaignAction(), FormState (+36 more)

### Community 5 - "Community 5"
Cohesion: 0.13
Nodes (27): MaterialRequestDoc, PurchaseInvoiceDoc, PurchaseOrderDoc, PurchaseReceiptDoc, RfqDoc, SupplierQuotationDoc, StockEntryDetailPage(), StockEntryDoc (+19 more)

### Community 6 - "Community 6"
Cohesion: 0.12
Nodes (33): DOC_TYPES, PurchaseAnalyticsPage(), RANGES, SearchParams, TREE_TYPES, VALUE_QUANTITY, BuyingSimpleReportPage(), SearchParams (+25 more)

### Community 7 - "Community 7"
Cohesion: 0.08
Nodes (33): Config, load_config(), Configuration loading for the Ceylon Stack ERPNext MCP server., Load and validate required ERPNext connection settings.      Raises RuntimeError, ERPNextClient, ERPNextError, _extract_error(), _json() (+25 more)

### Community 8 - "Community 8"
Cohesion: 0.08
Nodes (31): AppLayout(), FullscreenToggle(), activeModuleStore, BUYING_NAV_GROUPS, DashboardLink(), DEFAULT_STATE, findActiveGroupId(), isItemActive() (+23 more)

### Community 9 - "Community 9"
Cohesion: 0.18
Nodes (23): PurchaseInvoiceDetailPage(), PurchaseOrderDetailPage(), DeliveryNoteDetailPage(), DeliveryNoteDoc, SalesInvoiceDetailPage(), SalesInvoiceDoc, SalesOrderDetailPage(), SalesOrderDoc (+15 more)

### Community 10 - "Community 10"
Cohesion: 0.11
Nodes (26): buildInvoiceItemFromPurchaseOrder(), buildInvoiceItemFromPurchaseReceipt(), buildPurchaseInvoiceFields(), cancelPurchaseInvoiceAction(), createPurchaseInvoiceAction(), createPurchaseInvoiceFromPurchaseOrder(), createPurchaseInvoiceFromPurchaseOrderAction(), createPurchaseInvoiceFromPurchaseReceipt() (+18 more)

### Community 11 - "Community 11"
Cohesion: 0.11
Nodes (17): getServerSnapshot(), getSnapshot(), listeners, ReportsList(), setStoredView(), subscribe(), ViewMode, BUYING_PERIOD_OPTIONS (+9 more)

### Community 12 - "Community 12"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 13 - "Community 13"
Cohesion: 0.11
Nodes (21): CreatePurchaseOrderFromSupplierQuotationPage(), SupplierQuotationForPO, SupplierQuotationItemForPO, NewQuotationPage(), batchSerialTotal(), emptyRow, hasPricingRule(), LineItemsEditor() (+13 more)

### Community 14 - "Community 14"
Cohesion: 0.13
Nodes (19): buildWorkOrderFields(), createWorkOrderAction(), FormState, humanizeError(), toErpDatetime(), StockBadge(), matchWarehouse(), round4() (+11 more)

### Community 15 - "Community 15"
Cohesion: 0.14
Nodes (22): buildInvoiceItem(), buildInvoiceItemFromDeliveryNote(), buildSalesInvoiceFields(), bulkCreateSalesInvoicesFromOrdersAction(), cancelSalesInvoiceAction(), createSalesInvoiceAction(), createSalesInvoiceFromDeliveryNote(), createSalesInvoiceFromDeliveryNoteAction() (+14 more)

### Community 16 - "Community 16"
Cohesion: 0.15
Nodes (21): deliveryNoteStatus(), isOverdue(), PURCHASE_INVOICE_STATUS_TONE, QUOTATION_STATUS_TONE, quotationStatus(), SALES_INVOICE_STATUS_TONE, salesInvoiceStatus(), salesOrderStatus() (+13 more)

### Community 17 - "Community 17"
Cohesion: 0.15
Nodes (20): attachBatchSerialBundles(), BatchSerialAttachInput, buildDeliveryNoteFields(), cancelDeliveryNoteAction(), createDeliveryNoteAction(), createDeliveryNoteFromSalesOrderAction(), FormState, humanizeError() (+12 more)

### Community 18 - "Community 18"
Cohesion: 0.13
Nodes (14): SellingSettingsDoc, SellingSettingsPage(), DocTab, SellingSettingsFormShell(), SettingsFormState, SettingsFieldGroup(), SettingsFieldSpec, base64UrlToBytes() (+6 more)

### Community 19 - "Community 19"
Cohesion: 0.14
Nodes (18): PickListDetailPage(), PickListDoc, PickListLocation, PickListLocationRow, PickListLocationsTable(), EditablePickListLocation, EditorState, PickListPickedQtyEditor() (+10 more)

### Community 20 - "Community 20"
Cohesion: 0.14
Nodes (20): apps/frontend README, Service-account proxy auth model, Buying module (apps/frontend), Ceylon Stack frontend design system, Inventory/Stock module (apps/frontend), Sales module (apps/frontend), qa-tester agent, Frontend Design Doc Supersedes DESIGN.md for apps/frontend (+12 more)

### Community 21 - "Community 21"
Cohesion: 0.21
Nodes (19): MaterialRequestDetailPage(), PurchaseReceiptDetailPage(), RfqDetailPage(), SupplierQuotationDetailPage(), buildNode(), dedupeRefs(), DocRef, findRoots() (+11 more)

### Community 22 - "Community 22"
Cohesion: 0.13
Nodes (15): CreateDeliveryNoteFromPickListPage(), PickListForSelection, PickListLocationForSelection, SalesOrderRateLookup, QuotationForSelection, QuotationItemForSelection, BatchSerialEntry, batchSerialTotal() (+7 more)

### Community 23 - "Community 23"
Cohesion: 0.11
Nodes (20): Smart Factory Module Declaration, Smart Factory Patches Config, Data Flow (MQTT to Frontend), frontend (dashboards, digital twin), Headless Architecture Decision, Layered View (Shop Floor to Analytics), mcp-server (ERPNext API tool wrapper), mes-service (MQTT to OEE calc) (+12 more)

### Community 24 - "Community 24"
Cohesion: 0.11
Nodes (20): Applied Dashboard UI Preview, Export-Ledger Color Palette (Sapphire/Tea/Turmeric/Terracotta), Gem-Stack Mark & Lockups, Why 'Ceylon Stack' (Naming Rationale), Ceylon Stack Color Tokens (sapphire/cinnamon/tea/turmeric/terracotta), Ceylon Stack Naming & Positioning Line, Web Favicon/Manifest Integration Snippet, Brand Guide (Visual Usage Guidelines) (+12 more)

### Community 25 - "Community 25"
Cohesion: 0.19
Nodes (16): buildPurchaseOrderFields(), cancelPurchaseOrderAction(), createPurchaseOrderAction(), createPurchaseOrderFromSupplierQuotationAction(), FormState, humanizeError(), parsePurchaseOrderItems(), PurchaseOrderItemInput (+8 more)

### Community 26 - "Community 26"
Cohesion: 0.18
Nodes (16): buildStockEntryFields(), EligibilityDoc, FormState, humanizeError(), parseTransferRows(), saveTransferDraftAction(), submitTransferAction(), TransferRowInput (+8 more)

### Community 27 - "Community 27"
Cohesion: 0.17
Nodes (11): NewMaterialRequestPage(), NewDeliveryNotePage(), NewSalesInvoicePage(), DeliveryNoteForm(), DeliveryNoteFormState, MaterialRequestForm(), MaterialRequestFormState, SalesInvoiceForm() (+3 more)

### Community 28 - "Community 28"
Cohesion: 0.18
Nodes (16): cancelRfqAction(), createRfqFromMaterialRequestAction(), FormState, humanizeError(), SourceMaterialRequest, SourceMaterialRequestItem, submitRfqAction(), cancelSupplierQuotationAction() (+8 more)

### Community 29 - "Community 29"
Cohesion: 0.20
Nodes (15): chipWidth(), SalesFlowMap(), SCENE_ORDER, relatedNodes(), SalesFlowNodeDialog(), SelectedFlowNode, FLOW_RECORDS, FLOW_SCENES (+7 more)

### Community 30 - "Community 30"
Cohesion: 0.12
Nodes (17): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+9 more)

### Community 31 - "Community 31"
Cohesion: 0.21
Nodes (16): buildSalesOrderFields(), bulkCloseSalesOrdersAction(), bulkReopenSalesOrdersAction(), cancelSalesOrderAction(), createSalesOrderAction(), createSalesOrderFromQuotationAction(), FormState, humanizeError() (+8 more)

### Community 32 - "Community 32"
Cohesion: 0.18
Nodes (16): cancelPickListAction(), createDeliveryNoteFromPickListAction(), createPickListFromSalesOrderAction(), FormState, humanizeError(), LocationUpdateInput, parseLocationRows(), PickListForDelivery (+8 more)

### Community 33 - "Community 33"
Cohesion: 0.21
Nodes (15): attachBatchSerialBundles(), buildStockEntryFields(), cancelStockEntryAction(), createStockEntryAction(), FormState, humanizeError(), Purpose, PURPOSES (+7 more)

### Community 34 - "Community 34"
Cohesion: 0.17
Nodes (13): CopiedQuotationFields, CopyFromQuotationPanel(), DiscountFields(), ORDER_TYPES, SalesOrderForm(), SalesOrderFormState, CopyableQuotation, getQuotationForCopy() (+5 more)

### Community 35 - "Community 35"
Cohesion: 0.18
Nodes (17): CLAUDE.md (master control entry point), Agro-Processing Specialist Agent, Apparel & Textile Specialist Agent, Brand/Marketing Designer Agent, code-reviewer agent, Finance & Reporting Agent, frontend-dev agent, product-designer agent (+9 more)

### Community 36 - "Community 36"
Cohesion: 0.14
Nodes (14): CreateSalesInvoiceFromDeliveryNotePage(), DeliveryNoteForSelection, DeliveryNoteItemForSelection, DnInvoiceItemRow, getInvoicedQtyByDnDetail(), InvoiceItemRow, PoInvoiceItemRow, PrInvoiceItemRow (+6 more)

### Community 37 - "Community 37"
Cohesion: 0.17
Nodes (12): CreateDeliveryNoteFromSalesOrderPage(), SalesOrderForSelection, SalesOrderItemForSelection, CreatePickListFromSalesOrderPage(), SalesOrderForSelection, SalesOrderItemForSelection, NewSalesOrderPage(), CompanyDoc (+4 more)

### Community 38 - "Community 38"
Cohesion: 0.19
Nodes (16): Hetzner Cloud infrastructure, AGPL vs GPL license rationale (CRM/Helpdesk/Insights), ceylon_services app, Frappe HR (hrms) product add-on, Product Portfolio plan (2026-09-13), PROGRESS.md (chronological dev log), ceylon_services app (built), deploy-smart-factory skill (+8 more)

### Community 39 - "Community 39"
Cohesion: 0.16
Nodes (15): Ceylon Services App Overview, Local Dev Notes (pre-pull placeholder history), smart_factory App Overview (Desk theming now, Manufacturing/OEE later), frontend Next.js app, Headless Architecture Decision, mcp-server app, mes-service app, smart_factory Frappe app (+7 more)

### Community 40 - "Community 40"
Cohesion: 0.13
Nodes (15): dependencies, jspdf-autotable, lucide-react, next, react, react-dom, server-only, xlsx (+7 more)

### Community 41 - "Community 41"
Cohesion: 0.24
Nodes (10): createSupplierAction(), fieldsFromForm(), FormState, humanizeError(), updateSupplierAction(), EditSupplierPage(), SupplierDoc, NewSupplierPage() (+2 more)

### Community 42 - "Community 42"
Cohesion: 0.24
Nodes (10): createCustomerAction(), fieldsFromForm(), FormState, humanizeError(), updateCustomerAction(), CustomerDoc, EditCustomerPage(), NewCustomerPage() (+2 more)

### Community 43 - "Community 43"
Cohesion: 0.18
Nodes (14): MES/OEE Service App, mes-service Overview (FastAPI real-time MES/OEE core), ERP Functional/Implementation Consultant Agent, Phase 0 ERPNext Walkthrough Gate, frappe-dev agent, Manufacturing Floor Agent, MES/IoT Developer Agent, ERP Inventory Findings (docs/erp-inventory.md) (+6 more)

### Community 44 - "Community 44"
Cohesion: 0.23
Nodes (9): NewWorkOrderPage(), NewStockEntryPage(), Purpose, PURPOSES, StockEntryForm(), StockEntryFormState, listManufacturableItemOptions(), getStockDefaults() (+1 more)

### Community 45 - "Community 45"
Cohesion: 0.27
Nodes (6): createItemAction(), FormState, humanizeError(), updateItemAction(), ItemDoc, ItemForm()

### Community 46 - "Community 46"
Cohesion: 0.23
Nodes (10): buildSerialNoFields(), createSerialNoAction(), FormState, humanizeError(), updateSerialNoAction(), EditSerialNoPage(), SerialNoDoc, STATUS_OPTIONS (+2 more)

### Community 47 - "Community 47"
Cohesion: 0.30
Nodes (11): amendQuotationAction(), buildQuotationFields(), cancelQuotationAction(), createQuotationAction(), FormState, humanizeError(), QuotationForAmend, setQuotationAsLostAction() (+3 more)

### Community 48 - "Community 48"
Cohesion: 0.22
Nodes (6): CHECKBOX_KEYS, createItemGroupAction(), FormState, TEXT_KEYS, updateItemGroupAction(), ItemGroupDoc

### Community 49 - "Community 49"
Cohesion: 0.22
Nodes (6): CHECKBOX_KEYS, createPriceListAction(), FormState, TEXT_KEYS, updatePriceListAction(), PriceListDoc

### Community 50 - "Community 50"
Cohesion: 0.29
Nodes (8): buildBatchFields(), createBatchAction(), FormState, humanizeError(), updateBatchAction(), BatchDoc, EditBatchPage(), NewBatchPage()

### Community 51 - "Community 51"
Cohesion: 0.29
Nodes (8): buildWarehouseFields(), createWarehouseAction(), FormState, humanizeError(), updateWarehouseAction(), EditWarehousePage(), WarehouseDoc, NewWarehousePage()

### Community 52 - "Community 52"
Cohesion: 0.40
Nodes (10): CompletedProcess, bench(), docker_exec(), ensure_frontend_has_app(), ensure_hostname_alias(), main(), preflight_check_apps_on_backend(), Fail fast, before creating anything, if this bench has never had 	`bench get-app (+2 more)

### Community 53 - "Community 53"
Cohesion: 0.31
Nodes (8): jspdf, ExportMenu(), csvEscape(), downloadBlob(), exportToCsv(), exportToExcel(), exportToPdf(), jspdf

### Community 54 - "Community 54"
Cohesion: 0.36
Nodes (9): buildMaterialRequestFields(), cancelMaterialRequestAction(), createMaterialRequestAction(), FormState, humanizeError(), MaterialRequestItemInput, parseMaterialRequestItems(), submitMaterialRequestAction() (+1 more)

### Community 55 - "Community 55"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 56 - "Community 56"
Cohesion: 0.39
Nodes (6): formatCurrencyCard(), SalesHomePage(), formatK(), LineChart(), getSellingNumberCards(), getThisQuarterRange()

### Community 57 - "Community 57"
Cohesion: 0.28
Nodes (5): CreateAction, DocActionState, DOCTYPE_ICON, RelationshipMap(), RelationshipNode

### Community 58 - "Community 58"
Cohesion: 0.36
Nodes (8): Manufacturing module (apps/frontend), apps/mcp-server README, Discovery tools (ping, list_doctypes, get_doctype_fields, list_documents), Manufacturing MCP tools (get_manufacturing_overview, get_work_order_detail, list_work_orders, list_job_cards, get_job_card_detail), Two-tier access model (dev tier vs client tier), inventory-procurement agent, mcp-dev agent, Current Mission Priority Lock

### Community 59 - "Community 59"
Cohesion: 0.36
Nodes (7): cancelPurchaseReceiptAction(), createPurchaseReceiptFromPurchaseOrderAction(), FormState, humanizeError(), PurchaseOrderForReceipt, PurchaseOrderItemForReceipt, submitPurchaseReceiptAction()

### Community 60 - "Community 60"
Cohesion: 0.29
Nodes (6): CompanyDoc, CreateSupplierQuotationPage(), RfqForSq, RfqItemForSq, CreateSupplierQuotationForm(), FormState

### Community 61 - "Community 61"
Cohesion: 0.25
Nodes (5): JobCardRow, MaterialTransferRow, WorkOrderDoc, WorkOrderItemRow, WorkOrderOperationRow

### Community 62 - "Community 62"
Cohesion: 0.32
Nodes (4): MASTER_DATA_WORKSPACE_CARDS, SELLING_WORKSPACE_CARDS, WorkspaceCard, WorkspaceLink

### Community 63 - "Community 63"
Cohesion: 0.29
Nodes (7): What's Inside ERPNext (Feature Pack), Ceylon Stack Playbook Overview, HR & Payroll — Frappe HR (Separate App), Before You Rebrand — GPL-3.0 Note, ERPNext Platform Reference Overview, Handoff Note for Separate Developer, Licensing Note (GPL-3.0 hrms vs AGPL-3.0 crm/helpdesk/insights)

### Community 64 - "Community 64"
Cohesion: 0.47
Nodes (6): ACCESS.md — Server, Repo & Command Reference, Hetzner Cloud Server (ubuntu-4gb-hel1-4), DevOps Agent, Security Specialist Agent, Deploy Smart Factory Skill, Manual Docker cp + Restart Deploy Stopgap

### Community 65 - "Community 65"
Cohesion: 0.47
Nodes (3): columns, ItemRow, ItemsTable()

### Community 66 - "Community 66"
Cohesion: 0.40
Nodes (4): CreateRfqForm(), FormState, ItemForDisplay, SupplierMultiSelect()

### Community 67 - "Community 67"
Cohesion: 0.40
Nodes (6): backend/db/queue/scheduler/websocket services, frontend service (nginx-entrypoint, FRAPPE_SITE_NAME_HEADER), Swarm-mode restart_policy (No-Op under docker compose), Known Open Gaps (Restart Policy, Default Passwords), pwd.yml FRAPPE_SITE_NAME_HEADER Fix (Critical), Operational Scripts (Backup/Deploy/Health Check)

### Community 68 - "Community 68"
Cohesion: 0.60
Nodes (4): POST(), verifyErpNextLogin(), bytesToBase64Url(), signSession()

### Community 69 - "Community 69"
Cohesion: 0.40
Nodes (3): metadata, plexMono, plexSans

### Community 70 - "Community 70"
Cohesion: 0.40
Nodes (3): MaterialTransferPreviewResult, TransferMaterialPreview, TransferMaterialRow

### Community 71 - "Community 71"
Cohesion: 0.60
Nodes (5): Architecture Decision Records doc, ADR-002: Keep canonical model independent from Frappe, ADR-004: Migrate native backend domain-by-domain, ADR-005: Use behavioral compatibility tests before migrating any domain, ADR-006: Do not migrate accounting/stock valuation until verified

### Community 74 - "Community 74"
Cohesion: 0.50
Nodes (4): Industries & Fit (8 Sri Lankan Segments), Manufacturing Module Reference, What's Relevant to Ceylon Stack v1, Stock (Inventory) Module Reference

### Community 75 - "Community 75"
Cohesion: 0.50
Nodes (4): Discount Logic Comparison, Native vs Gaps Scoping Decision (Phase 1), Quotation Scenarios (ERPNext vs SAP B1 vs Acumatica vs D365), Sales Order Scenarios (Partial Delivery, Backorder, Blanket Orders)

### Community 81 - "Community 81"
Cohesion: 0.67
Nodes (3): Mission Lock Drift Note, Current Mission (Sept 2026), Module Sequencing Rules

### Community 82 - "Community 82"
Cohesion: 0.67
Nodes (3): Cancellation & Amendment Logic, Universal Document Flow (Lead to Payment), Returns / Credit Notes Comparison

### Community 83 - "Community 83"
Cohesion: 0.67
Nodes (3): Practice Site Setup Steps (bench new-site), What To Test on Practice Site, Why a Second Site, Not a Second Server

## Ambiguous Edges - Review These
- `Ceylon Stack Color Tokens (sapphire/cinnamon/tea/turmeric/terracotta)` → `Industrial-Functional Color Palette (graphite/signal/alert/success)`  [AMBIGUOUS]
  docs/brand/package/ceylon-stack-frontend-design.md · relation: semantically_similar_to
- `Brand Guide (Visual Usage Guidelines)` → `Ceylon Stack Brand Guide (Full Package Doc)`  [AMBIGUOUS]
  docs/brand/package/Ceylon-Stack-Brand-Guide.html · relation: semantically_similar_to

## Knowledge Gaps
- **509 isolated node(s):** `python`, `ceylon_services`, `eslintConfig`, `name`, `version` (+504 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **42 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Ceylon Stack Color Tokens (sapphire/cinnamon/tea/turmeric/terracotta)` and `Industrial-Functional Color Palette (graphite/signal/alert/success)`?**
  _Edge tagged AMBIGUOUS (relation: semantically_similar_to) - confidence is low._
- **What is the exact relationship between `Brand Guide (Visual Usage Guidelines)` and `Ceylon Stack Brand Guide (Full Package Doc)`?**
  _Edge tagged AMBIGUOUS (relation: semantically_similar_to) - confidence is low._
- **Why does `fetchLinkOptions()` connect `Community 6` to `Community 0`, `Community 3`, `Community 4`, `Community 5`, `Community 9`, `Community 10`, `Community 13`, `Community 18`, `Community 21`, `Community 25`, `Community 27`, `Community 37`, `Community 41`, `Community 42`, `Community 44`, `Community 46`, `Community 50`, `Community 51`, `Community 56`, `Community 60`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Community 40` to `Community 53`, `Community 55`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Community 30` to `Community 55`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **What connects `python`, `ceylon_services`, `eslintConfig` to the rest of the system?**
  _509 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05102040816326531 - nodes in this community are weakly interconnected._