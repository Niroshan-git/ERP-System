# Graph Report - D:/_07_ERP/ERP System  (2026-09-19)

## Corpus Check
- 42 files · ~616,941 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1663 nodes · 4169 edges · 149 communities (107 shown, 42 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 59 edges (avg confidence: 0.77)
- Token cost: 150,000 input · 38,251 output

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
- Community 80
- Community 81
- Community 82
- Community 83
- Community 84
- Community 85
- Community 86
- Community 88
- Community 89
- Community 90
- Community 91
- Community 92
- Community 94
- Community 95
- Community 96
- Community 97
- Community 98
- Community 99
- Community 101
- Community 102
- Community 103
- Community 104
- Community 105
- Community 110
- Community 111
- Community 116
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
- Community 139
- Community 140
- Community 141
- Community 142
- Community 143
- Community 144
- Community 145
- Community 146
- Community 147
- Community 148

## God Nodes (most connected - your core abstractions)
1. `fetchLinkOptions()` - 103 edges
2. `listDocs()` - 60 edges
3. `getDoc()` - 58 edges
4. `ErpNextError` - 56 edges
5. `getCount()` - 42 edges
6. `parsePage()` - 41 edges
7. `parsePageSize()` - 41 edges
8. `paginate()` - 41 edges
9. `listItemOptions()` - 39 edges
10. `getConnections()` - 37 edges

## Surprising Connections (you probably didn't know these)
- `Two-tier access model (dev tier vs client tier)` --semantically_similar_to--> `Current Mission Priority Lock`  [INFERRED] [semantically similar]
  apps/mcp-server/README.md → CLAUDE.md
- `Claude Code Subagent Roster (Dev/DevOps/Client-Facing)` --semantically_similar_to--> `AI Agents (MCP) (Doc Section, Planned)`  [INFERRED] [semantically similar]
  PROGRESS.md → docs/ceylon-stack-documentation.html
- `DevOps Agent` --shares_data_with--> `ACCESS.md — Server, Repo & Command Reference`  [INFERRED]
  .claude/agents/devops.md → ACCESS.md
- `PLAN.md (week-by-week build plan)` --references--> `Week 7-8: Mobile-Friendly Frontend + Dashboards`  [EXTRACTED]
  .claude/agents/erp-functional-consultant.md → PLAN.md
- `Agro-Processing Specialist Agent` --references--> `CLAUDE.md (master control entry point)`  [EXTRACTED]
  .claude/agents/agro-processing.md → CLAUDE.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Manufacturing Packages 2/3/5 Combined Dual-Agent Review Cycle** — docs_operations_ai_work_log_mfg_pkg2, docs_operations_ai_work_log_mfg_pkg3, docs_operations_ai_work_log_mfg_pkg5, docs_operations_ai_work_log_cx_mfg_001, docs_operations_ai_work_log_cx_mfg_002, qa_log_cx_mfg_governance_corrections [EXTRACTED 1.00]
- **Master Data Canonicalization Program (Nav Shell + Item + Business Partner Domains)** — progress_master_data_canonicalization, qa_log_master_data_item_domain_qa, qa_log_master_data_business_partner_qa, docs_operations_ai_work_log_md_item_domain, docs_operations_ai_work_log_md1_package, docs_operations_ai_work_log_cx_md_001 [EXTRACTED 1.00]
- **Sales->Buying->Stock->Manufacturing Module Priority Lock** — progress_sales_phases_1_3, progress_buying_core_cycle, progress_inventory_mvp_stock_module, progress_manufacturing_frontend_packages, docs_controls_frontend_guide_module_priority [EXTRACTED 1.00]
- **Competing Ceylon Stack Color Token Systems** — docs_brand_md_color_tokens, docs_brand_ceylon_stack_branding_color_palette, docs_brand_package_ceylon_stack_frontend_design_color_palette [INFERRED 0.75]
- **MCP Agent Roster Across Docs** — docs_ceylon_stack_playbook_agent_roster, docs_mcp_agents_plan_phase2_agents, docs_ceylon_stack_documentation_roadmap_agents [INFERRED 0.85]
- **Package closure / Definition of Done workflow** — claude_package_closure_rules, claude_agents_code_reviewer, claude_agents_qa_tester, claude_agents_release_tracker, qa_log, progress [INFERRED 0.85]
- **Apps implementing the headless architecture split** — claude_headless_architecture, claude_smart_factory_app, claude_frontend_app, claude_mes_service_app, claude_mcp_server_app [INFERRED 0.85]
- **Stock-Entry-driven material deviation pattern** — docs_backend_05_manufacturing_work_order_work_order, docs_backend_05_manufacturing_material_transfer_material_transfer, docs_backend_05_manufacturing_material_transfer_mfg_stk_001, docs_backend_05_manufacturing_work_order_mfg_wf_002 [EXTRACTED 1.00]
- **Backend knowledge capture documentation pipeline** — docs_controls_backend_knowledge_policy_backend_knowledge_policy, docs_backend_00_architecture_readme_canonical_model_layer_stack, docs_backend_15_migration_migration_status_migration_status_table, docs_backend_99_unverified_unverified_behaviours_unverified_behaviours [INFERRED 0.85]
- **Agent governance binding control document system** — docs_controls_agent_operating_guide_agent_operating_guide, docs_controls_agent_usage_policy_agent_usage_policy, docs_controls_development_system_rules_development_system_rules, docs_controls_frontend_guide_frontend_guide [EXTRACTED 1.00]

## Communities (149 total, 42 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (59): createCampaignAction(), FormState, TEXT_KEYS, updateCampaignAction(), CampaignDoc, fields, fields, createSalesPartnerAction() (+51 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (37): CreateRfqFromMaterialRequestPage(), MaterialRequestForRfq, MaterialRequestItemForRfq, CreatePurchaseInvoiceFromPurchaseOrderPage(), PurchaseOrderForSelection, PurchaseOrderItemForSelection, PurchaseOrderForSelection, PurchaseOrderItemForSelection (+29 more)

### Community 2 - "Community 2"
Cohesion: 0.14
Nodes (35): MaterialRequestDoc, PurchaseInvoiceDoc, PurchaseOrderDoc, PurchaseReceiptDoc, RfqDoc, SupplierQuotationDoc, DeliveryNoteDoc, SalesInvoiceDoc (+27 more)

### Community 3 - "Community 3"
Cohesion: 0.12
Nodes (34): ColumnPicker(), DataTable(), columns, columns, columns, ProgressBar(), columns, columns (+26 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (51): Architecture Decision Records, Canonical Mapping Standard, Canonical Model Layer Stack, FRAPPE_CURRENT_BEHAVIOR tag, FRAPPE_ONLY_IMPLEMENTATION_DETAIL tag, REQUIRED_CEYLON_BEHAVIOR tag, Two Backends, One Product, Job Card (read-only fields) (+43 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (33): Config, load_config(), Configuration loading for the Ceylon Stack ERPNext MCP server., Load and validate required ERPNext connection settings.      Raises RuntimeError, ERPNextClient, ERPNextError, _extract_error(), _json() (+25 more)

### Community 6 - "Community 6"
Cohesion: 0.10
Nodes (35): buildInvoiceItemFromPurchaseOrder(), buildInvoiceItemFromPurchaseReceipt(), buildPurchaseInvoiceFields(), cancelPurchaseInvoiceAction(), createPurchaseInvoiceAction(), createPurchaseInvoiceFromPurchaseOrder(), createPurchaseInvoiceFromPurchaseOrderAction(), createPurchaseInvoiceFromPurchaseReceipt() (+27 more)

### Community 7 - "Community 7"
Cohesion: 0.07
Nodes (39): AI Agents (MCP) (Doc Section, Planned), Buying Module (Doc Section, Live), Ceylon Stack Product Overview, Changelog & Sources (Doc Section), ERPNext Core & Desk Branding (Doc Section, Live), Ceylon Stack Frontend - Platform (Doc Section, Live), The Headless Stack (Doc Architecture Section), Inventory / Stock Module (Doc Section, Live) (+31 more)

### Community 8 - "Community 8"
Cohesion: 0.08
Nodes (31): AppLayout(), FullscreenToggle(), activeModuleStore, BUYING_NAV_GROUPS, DashboardLink(), DEFAULT_STATE, findActiveGroupId(), isItemActive() (+23 more)

### Community 9 - "Community 9"
Cohesion: 0.09
Nodes (34): CreateSalesInvoiceFromDeliveryNotePage(), DeliveryNoteForSelection, DeliveryNoteItemForSelection, buildInvoiceItem(), buildInvoiceItemFromDeliveryNote(), buildSalesInvoiceFields(), bulkCreateSalesInvoicesFromOrdersAction(), cancelSalesInvoiceAction() (+26 more)

### Community 10 - "Community 10"
Cohesion: 0.10
Nodes (32): buildMaterialRequestFields(), cancelMaterialRequestAction(), createMaterialRequestAction(), FormState, humanizeError(), MaterialRequestItemInput, parseMaterialRequestItems(), submitMaterialRequestAction() (+24 more)

### Community 11 - "Community 11"
Cohesion: 0.13
Nodes (29): MaterialRequestDetailPage(), PurchaseInvoiceDetailPage(), PurchaseOrderDetailPage(), PurchaseReceiptDetailPage(), RfqDetailPage(), SupplierQuotationDetailPage(), buildNode(), dedupeRefs() (+21 more)

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (16): AddressRow, ContactRow, CustomerGroupRow, TerritoryRow, CampaignRow, SalesPartnerRow, SalesPersonRow, BatchRow (+8 more)

### Community 13 - "Community 13"
Cohesion: 0.12
Nodes (28): DeliveryNoteDetailPage(), SalesInvoiceDetailPage(), SalesOrderDetailPage(), QuotationDetailPage(), listItemOptions(), deliveryNoteStatus(), isOverdue(), PURCHASE_INVOICE_STATUS_TONE (+20 more)

### Community 14 - "Community 14"
Cohesion: 0.09
Nodes (25): POST(), MaterialTransferPreviewResult, TransferMaterialPreview, TransferMaterialRow, callMethodWithResult(), createDoc(), deleteDoc(), DocInfoComment (+17 more)

### Community 15 - "Community 15"
Cohesion: 0.10
Nodes (26): NewSalesInvoicePage(), CreatePickListFromSalesOrderPage(), SalesOrderForSelection, SalesOrderItemForSelection, NewSalesOrderPage(), cancelPickListAction(), createDeliveryNoteFromPickListAction(), createPickListFromSalesOrderAction() (+18 more)

### Community 16 - "Community 16"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 17 - "Community 17"
Cohesion: 0.12
Nodes (18): NewMaterialRequestPage(), CreatePurchaseOrderFromSupplierQuotationPage(), SupplierQuotationForPO, SupplierQuotationItemForPO, NewDeliveryNotePage(), DeliveryNoteForm(), DeliveryNoteFormState, LineRow (+10 more)

### Community 18 - "Community 18"
Cohesion: 0.12
Nodes (21): SellingSettingsDoc, SellingSettingsPage(), StockEntryDetailPage(), StockEntryDoc, summarizeBatchSerialEntries(), DocTab, SellingSettingsFormShell(), SettingsFormState (+13 more)

### Community 19 - "Community 19"
Cohesion: 0.10
Nodes (21): SearchParams, SORT_OPTIONS, STATUS_OPTIONS, WorkOrdersPage(), DeliveryNotesPage(), SearchParams, SORT_OPTIONS, STATUS_OPTIONS (+13 more)

### Community 20 - "Community 20"
Cohesion: 0.19
Nodes (22): PurchaseOrdersPage(), SearchParams, SORT_OPTIONS, STATUS_OPTIONS, CampaignsPage(), QuotationsPage(), SearchParams, SORT_OPTIONS (+14 more)

### Community 21 - "Community 21"
Cohesion: 0.12
Nodes (19): MaterialRequestsPage(), SearchParams, SORT_OPTIONS, STATUS_OPTIONS, PurchaseInvoicesPage(), SearchParams, SORT_OPTIONS, STATUS_OPTIONS (+11 more)

### Community 22 - "Community 22"
Cohesion: 0.16
Nodes (19): attachBatchSerialBundles(), BatchSerialAttachInput, buildDeliveryNoteFields(), cancelDeliveryNoteAction(), createDeliveryNoteAction(), createDeliveryNoteFromSalesOrderAction(), FormState, humanizeError() (+11 more)

### Community 23 - "Community 23"
Cohesion: 0.18
Nodes (20): buildSalesOrderFields(), bulkCloseSalesOrdersAction(), bulkReopenSalesOrdersAction(), cancelSalesOrderAction(), createSalesOrderAction(), createSalesOrderFromQuotationAction(), FormState, humanizeError() (+12 more)

### Community 24 - "Community 24"
Cohesion: 0.17
Nodes (16): ItemWiseSalesRegisterPage(), SearchParams, DOC_TYPES, RANGES, SalesAnalyticsPage(), SearchParams, TREE_TYPES, VALUE_QUANTITY (+8 more)

### Community 25 - "Community 25"
Cohesion: 0.11
Nodes (20): Smart Factory Module Declaration, Smart Factory Patches Config, Data Flow (MQTT to Frontend), frontend (dashboards, digital twin), Headless Architecture Decision, Layered View (Shop Floor to Analytics), mcp-server (ERPNext API tool wrapper), mes-service (MQTT to OEE calc) (+12 more)

### Community 26 - "Community 26"
Cohesion: 0.11
Nodes (20): Applied Dashboard UI Preview, Export-Ledger Color Palette (Sapphire/Tea/Turmeric/Terracotta), Gem-Stack Mark & Lockups, Why 'Ceylon Stack' (Naming Rationale), Ceylon Stack Color Tokens (sapphire/cinnamon/tea/turmeric/terracotta), Ceylon Stack Naming & Positioning Line, Web Favicon/Manifest Integration Snippet, Brand Guide (Visual Usage Guidelines) (+12 more)

### Community 27 - "Community 27"
Cohesion: 0.17
Nodes (16): buildWorkOrderFields(), createWorkOrderAction(), FormState, humanizeError(), toErpDatetime(), matchWarehouse(), round4(), WorkOrderForm() (+8 more)

### Community 28 - "Community 28"
Cohesion: 0.18
Nodes (16): buildStockEntryFields(), EligibilityDoc, FormState, humanizeError(), parseTransferRows(), saveTransferDraftAction(), submitTransferAction(), TransferRowInput (+8 more)

### Community 29 - "Community 29"
Cohesion: 0.16
Nodes (11): getServerSnapshot(), getSnapshot(), listeners, ReportsList(), setStoredView(), subscribe(), ViewMode, PERIOD_OPTIONS (+3 more)

### Community 30 - "Community 30"
Cohesion: 0.18
Nodes (15): amendQuotationAction(), buildQuotationFields(), cancelQuotationAction(), createQuotationAction(), FormState, humanizeError(), QuotationForAmend, setQuotationAsLostAction() (+7 more)

### Community 31 - "Community 31"
Cohesion: 0.20
Nodes (15): chipWidth(), SalesFlowMap(), SCENE_ORDER, relatedNodes(), SalesFlowNodeDialog(), SelectedFlowNode, FLOW_RECORDS, FLOW_SCENES (+7 more)

### Community 32 - "Community 32"
Cohesion: 0.18
Nodes (17): ACCESS.md — Server, Repo & Command Reference, Hetzner Cloud Server (ubuntu-4gb-hel1-4), MES/OEE Service App, DevOps Agent, ERP Functional/Implementation Consultant Agent, Phase 0 ERPNext Walkthrough Gate, frappe-dev agent, frontend-dev agent (+9 more)

### Community 33 - "Community 33"
Cohesion: 0.12
Nodes (17): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+9 more)

### Community 34 - "Community 34"
Cohesion: 0.18
Nodes (10): formatCurrencyCard(), SalesHomePage(), formatK(), LineChart(), MASTER_DATA_WORKSPACE_CARDS, getSellingNumberCards(), getThisQuarterRange(), SELLING_WORKSPACE_CARDS (+2 more)

### Community 35 - "Community 35"
Cohesion: 0.17
Nodes (13): CopiedQuotationFields, CopyFromQuotationPanel(), DiscountFields(), ConfirmedLineRow, ORDER_TYPES, SalesOrderFormState, CopyableQuotation, getQuotationForCopy() (+5 more)

### Community 36 - "Community 36"
Cohesion: 0.19
Nodes (12): batchSerialTotal(), emptyRow, hasPricingRule(), LineItemsEditor(), pricingRuleSummary(), StockBadge(), PricingContext, PricingResolution (+4 more)

### Community 37 - "Community 37"
Cohesion: 0.14
Nodes (15): Ceylon Services App Overview, mes-service Overview (FastAPI real-time MES/OEE core), Local Dev Notes (pre-pull placeholder history), smart_factory App Overview (Desk theming now, Manufacturing/OEE later), Hetzner Cloud infrastructure, PLAN.md (week-by-week build plan), AGPL vs GPL license rationale (CRM/Helpdesk/Insights), ceylon_services app (+7 more)

### Community 38 - "Community 38"
Cohesion: 0.13
Nodes (15): dependencies, jspdf-autotable, lucide-react, next, react, react-dom, server-only, xlsx (+7 more)

### Community 39 - "Community 39"
Cohesion: 0.24
Nodes (8): createCustomerAction(), fieldsFromForm(), FormState, humanizeError(), updateCustomerAction(), CustomerDoc, CUSTOMER_TYPES, CustomerForm()

### Community 40 - "Community 40"
Cohesion: 0.24
Nodes (8): createSupplierAction(), fieldsFromForm(), FormState, humanizeError(), updateSupplierAction(), SupplierDoc, SUPPLIER_TYPES, SupplierForm()

### Community 41 - "Community 41"
Cohesion: 0.20
Nodes (15): CLAUDE.md (master control entry point), Agro-Processing Specialist Agent, Apparel & Textile Specialist Agent, Brand/Marketing Designer Agent, code-reviewer agent, Finance & Reporting Agent, product-designer agent, qa-tester agent (+7 more)

### Community 42 - "Community 42"
Cohesion: 0.22
Nodes (8): CHECKBOX_KEYS, createAddressAction(), FormState, TEXT_KEYS, updateAddressAction(), validate(), ADDRESS_TYPES, AddressDoc

### Community 43 - "Community 43"
Cohesion: 0.23
Nodes (9): NewWorkOrderPage(), NewStockEntryPage(), Purpose, PURPOSES, StockEntryForm(), StockEntryFormState, listManufacturableItemOptions(), getStockDefaults() (+1 more)

### Community 44 - "Community 44"
Cohesion: 0.27
Nodes (6): createItemAction(), FormState, humanizeError(), updateItemAction(), ItemDoc, ItemForm()

### Community 45 - "Community 45"
Cohesion: 0.21
Nodes (8): BuyingSimpleReportPage(), SearchParams, BUYING_PERIOD_OPTIONS, BUYING_REPORT_CATALOG, BUYING_SIMPLE_REPORTS, BUYING_TREND_BASED_ON_OPTIONS, ReportCatalogEntry, SimpleReportConfig

### Community 46 - "Community 46"
Cohesion: 0.21
Nodes (10): DOC_TYPES, PurchaseAnalyticsPage(), RANGES, SearchParams, TREE_TYPES, VALUE_QUANTITY, cellValue(), INTERNAL_ROUTES (+2 more)

### Community 47 - "Community 47"
Cohesion: 0.20
Nodes (7): createContactAction(), FormState, TEXT_KEYS, updateContactAction(), ContactDoc, fields, fields

### Community 48 - "Community 48"
Cohesion: 0.23
Nodes (9): PickListDetailPage(), PickListDoc, PickListLocation, PickListLocationRow, PickListLocationsTable(), EditablePickListLocation, EditorState, PickListPickedQtyEditor() (+1 more)

### Community 49 - "Community 49"
Cohesion: 0.29
Nodes (11): attachBatchSerialBundles(), buildStockEntryFields(), cancelStockEntryAction(), createStockEntryAction(), FormState, humanizeError(), Purpose, PURPOSES (+3 more)

### Community 50 - "Community 50"
Cohesion: 0.22
Nodes (6): CHECKBOX_KEYS, createCustomerGroupAction(), FormState, TEXT_KEYS, updateCustomerGroupAction(), CustomerGroupDoc

### Community 51 - "Community 51"
Cohesion: 0.22
Nodes (6): CHECKBOX_KEYS, createItemGroupAction(), FormState, TEXT_KEYS, updateItemGroupAction(), ItemGroupDoc

### Community 52 - "Community 52"
Cohesion: 0.22
Nodes (6): CHECKBOX_KEYS, createPriceListAction(), FormState, TEXT_KEYS, updatePriceListAction(), PriceListDoc

### Community 53 - "Community 53"
Cohesion: 0.22
Nodes (6): CHECKBOX_KEYS, createTerritoryAction(), FormState, TEXT_KEYS, updateTerritoryAction(), TerritoryDoc

### Community 54 - "Community 54"
Cohesion: 0.24
Nodes (11): frontend Next.js app, Headless Architecture Decision, mcp-server app, mes-service app, smart_factory Frappe app, Brand Rollout Order (Desk -> smart_factory -> frontend -> docs), ADR-001: Use ERPNext/Frappe as initial reference backend, Week 7-8: Mobile-Friendly Frontend + Dashboards (+3 more)

### Community 55 - "Community 55"
Cohesion: 0.40
Nodes (10): CompletedProcess, bench(), docker_exec(), ensure_frontend_has_app(), ensure_hostname_alias(), main(), preflight_check_apps_on_backend(), Fail fast, before creating anything, if this bench has never had 	`bench get-app (+2 more)

### Community 56 - "Community 56"
Cohesion: 0.31
Nodes (8): jspdf, ExportMenu(), csvEscape(), downloadBlob(), exportToCsv(), exportToExcel(), exportToPdf(), jspdf

### Community 57 - "Community 57"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 58 - "Community 58"
Cohesion: 0.22
Nodes (8): ADVANCE_PAYMENT_STATUS_OPTIONS, BILLING_STATUS_OPTIONS, DELIVERY_STATUS_OPTIONS, SalesOrdersPage(), SearchParams, SORT_OPTIONS, SalesOrderBulkTable(), SalesOrderRow

### Community 59 - "Community 59"
Cohesion: 0.25
Nodes (9): Ceylon Stack Frontend Guide (document), Buying Module Guide Section (§10), Standard List/Create/Edit Document Pattern, lib/erpnext.ts API Layer Rule, Manufacturing Module Guide Section (§11), Module Priority Order (Sales->Buying->Stock->Manufacturing->Accounting->Dashboard), Planned Role-Based Module Access, Stock Module Guide Section (§10a) (+1 more)

### Community 60 - "Community 60"
Cohesion: 0.25
Nodes (9): Finding CX-MFG-001: Untrusted Client Fields in Material Transfer Action, Finding CX-MFG-002: Work Order Operations Table Not Behaviorally Equivalent, Finding CX-MFG-003: Quality Readiness Ratio Population Mismatch, Finding CX-MFG-006: Duplicate item_code Row State Collision (NEEDS_VERIFICATION), Claude Code + Codex Dual-Agent Coordination Model, Ledger: Manufacturing Package 2 (Work Order Detail), Ledger: Manufacturing Package 3 (Work Order Create), Ledger: Manufacturing Package 5 (Material Transfer) (+1 more)

### Community 61 - "Community 61"
Cohesion: 0.36
Nodes (8): Manufacturing module (apps/frontend), apps/mcp-server README, Discovery tools (ping, list_doctypes, get_doctype_fields, list_documents), Manufacturing MCP tools (get_manufacturing_overview, get_work_order_detail, list_work_orders, list_job_cards, get_job_card_detail), Two-tier access model (dev tier vs client tier), inventory-procurement agent, mcp-dev agent, Current Mission Priority Lock

### Community 62 - "Community 62"
Cohesion: 0.29
Nodes (6): CompanyDoc, CreateSupplierQuotationPage(), RfqForSq, RfqItemForSq, CreateSupplierQuotationForm(), FormState

### Community 63 - "Community 63"
Cohesion: 0.25
Nodes (5): JobCardRow, MaterialTransferRow, WorkOrderDoc, WorkOrderItemRow, WorkOrderOperationRow

### Community 64 - "Community 64"
Cohesion: 0.36
Nodes (4): SearchParams, StockSimpleReportPage(), STOCK_REPORT_CATALOG, STOCK_SIMPLE_REPORTS

### Community 65 - "Community 65"
Cohesion: 0.29
Nodes (7): apps/frontend README, Service-account proxy auth model, Buying module (apps/frontend), Ceylon Stack frontend design system, Inventory/Stock module (apps/frontend), Sales module (apps/frontend), Frontend Design Doc Supersedes DESIGN.md for apps/frontend

### Community 66 - "Community 66"
Cohesion: 0.29
Nodes (6): PurchaseReceiptsPage(), SearchParams, SORT_OPTIONS, STATUS_OPTIONS, PurchaseReceiptRow, PurchaseReceiptsTable()

### Community 67 - "Community 67"
Cohesion: 0.29
Nodes (6): SearchParams, SORT_OPTIONS, STATUS_OPTIONS, SupplierQuotationsPage(), SupplierQuotationRow, SupplierQuotationsTable()

### Community 68 - "Community 68"
Cohesion: 0.29
Nodes (6): PickListsPage(), SearchParams, SORT_OPTIONS, STATUS_OPTIONS, PickListRow, PickListsTable()

### Community 69 - "Community 69"
Cohesion: 0.33
Nodes (6): SearchParams, SORT_OPTIONS, StockBalancePage(), StockBalanceRow, StockBalanceTable(), parsePage()

### Community 70 - "Community 70"
Cohesion: 0.29
Nodes (6): PURPOSE_OPTIONS, SearchParams, SORT_OPTIONS, StockEntriesPage(), StockEntriesTable(), StockEntryRow

### Community 71 - "Community 71"
Cohesion: 0.29
Nodes (7): What's Inside ERPNext (Feature Pack), Ceylon Stack Playbook Overview, HR & Payroll — Frappe HR (Separate App), Before You Rebrand — GPL-3.0 Note, ERPNext Platform Reference Overview, Handoff Note for Separate Developer, Licensing Note (GPL-3.0 hrms vs AGPL-3.0 crm/helpdesk/insights)

### Community 72 - "Community 72"
Cohesion: 0.47
Nodes (3): columns, CustomerRow, CustomersTable()

### Community 73 - "Community 73"
Cohesion: 0.47
Nodes (3): columns, ItemRow, ItemsTable()

### Community 74 - "Community 74"
Cohesion: 0.47
Nodes (3): columns, SupplierRow, SuppliersTable()

### Community 75 - "Community 75"
Cohesion: 0.40
Nodes (4): NewQuotationPage(), ORDER_TYPES, QuotationForm(), QuotationFormState

### Community 76 - "Community 76"
Cohesion: 0.40
Nodes (4): CreateRfqForm(), FormState, ItemForDisplay, SupplierMultiSelect()

### Community 77 - "Community 77"
Cohesion: 0.33
Nodes (3): DOCTYPE_ICON, RelationshipMap(), RelationshipNode

### Community 78 - "Community 78"
Cohesion: 0.40
Nodes (6): backend/db/queue/scheduler/websocket services, frontend service (nginx-entrypoint, FRAPPE_SITE_NAME_HEADER), Swarm-mode restart_policy (No-Op under docker compose), Known Open Gaps (Restart Policy, Default Passwords), pwd.yml FRAPPE_SITE_NAME_HEADER Fix (Critical), Operational Scripts (Backup/Deploy/Health Check)

### Community 79 - "Community 79"
Cohesion: 0.40
Nodes (3): metadata, plexMono, plexSans

### Community 80 - "Community 80"
Cohesion: 0.60
Nodes (5): Architecture Decision Records doc, ADR-002: Keep canonical model independent from Frappe, ADR-004: Migrate native backend domain-by-domain, ADR-005: Use behavioral compatibility tests before migrating any domain, ADR-006: Do not migrate accounting/stock valuation until verified

### Community 81 - "Community 81"
Cohesion: 0.50
Nodes (4): Industries & Fit (8 Sri Lankan Segments), Manufacturing Module Reference, What's Relevant to Ceylon Stack v1, Stock (Inventory) Module Reference

### Community 82 - "Community 82"
Cohesion: 0.50
Nodes (4): Discount Logic Comparison, Native vs Gaps Scoping Decision (Phase 1), Quotation Scenarios (ERPNext vs SAP B1 vs Acumatica vs D365), Sales Order Scenarios (Partial Delivery, Backorder, Blanket Orders)

### Community 88 - "Community 88"
Cohesion: 0.67
Nodes (3): Mission Lock Drift Note, Current Mission (Sept 2026), Module Sequencing Rules

### Community 89 - "Community 89"
Cohesion: 0.67
Nodes (3): Cancellation & Amendment Logic, Universal Document Flow (Lead to Payment), Returns / Credit Notes Comparison

### Community 90 - "Community 90"
Cohesion: 1.00
Nodes (3): Agent Operating Guide, Agent Usage Policy, Development System Rules

### Community 91 - "Community 91"
Cohesion: 0.67
Nodes (3): Practice Site Setup Steps (bench new-site), What To Test on Practice Site, Why a Second Site, Not a Second Server

## Ambiguous Edges - Review These
- `Ceylon Stack Color Tokens (sapphire/cinnamon/tea/turmeric/terracotta)` → `Industrial-Functional Color Palette (graphite/signal/alert/success)`  [AMBIGUOUS]
  docs/brand/package/ceylon-stack-frontend-design.md · relation: semantically_similar_to
- `Brand Guide (Visual Usage Guidelines)` → `Ceylon Stack Brand Guide (Full Package Doc)`  [AMBIGUOUS]
  docs/brand/package/Ceylon-Stack-Brand-Guide.html · relation: semantically_similar_to

## Knowledge Gaps
- **526 isolated node(s):** `python`, `ceylon_services`, `eslintConfig`, `name`, `version` (+521 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **42 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Ceylon Stack Color Tokens (sapphire/cinnamon/tea/turmeric/terracotta)` and `Industrial-Functional Color Palette (graphite/signal/alert/success)`?**
  _Edge tagged AMBIGUOUS (relation: semantically_similar_to) - confidence is low._
- **What is the exact relationship between `Brand Guide (Visual Usage Guidelines)` and `Ceylon Stack Brand Guide (Full Package Doc)`?**
  _Edge tagged AMBIGUOUS (relation: semantically_similar_to) - confidence is low._
- **Why does `fetchLinkOptions()` connect `Community 21` to `Community 0`, `Community 1`, `Community 2`, `Community 6`, `Community 11`, `Community 13`, `Community 15`, `Community 17`, `Community 18`, `Community 19`, `Community 20`, `Community 24`, `Community 30`, `Community 34`, `Community 43`, `Community 45`, `Community 46`, `Community 58`, `Community 62`, `Community 64`, `Community 66`, `Community 67`, `Community 68`, `Community 69`, `Community 70`, `Community 75`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Community 38` to `Community 56`, `Community 57`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Community 33` to `Community 57`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `python`, `ceylon_services`, `eslintConfig` to the rest of the system?**
  _526 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.051131354687040845 - nodes in this community are weakly interconnected._