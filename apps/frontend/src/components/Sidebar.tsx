"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  ArrowLeftRight,
  Box,
  Boxes,
  Building2,
  ChartNoAxesCombined,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  ClipboardList,
  Contact,
  Database,
  Factory,
  FileMinus,
  FilePenLine,
  Handshake,
  Layers,
  LayoutDashboard,
  ListTree,
  Map,
  MapPin,
  Megaphone,
  Package,
  PackageCheck,
  PackageOpen,
  PanelLeftClose,
  PanelLeftOpen,
  ReceiptText,
  ScanBarcode,
  Settings2,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Tags,
  Truck,
  Undo2,
  UserRound,
  Users,
  UsersRound,
  Wallet,
  Warehouse,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type SoonItem = {
  label: string;
  icon: LucideIcon;
  soon: true;
};

type NavGroupDef = {
  id: string;
  label: string;
  icon: LucideIcon;
  items: (NavItem | SoonItem)[];
};

// A module is a top-level, separately-addressable section of the app (Selling, Buying,
// Manufacturing, ...) — each gets its own home page and its own Sidebar nav-group set.
// `soon` marks a module that exists in the switcher but has no real route yet (greyed
// out, unclickable), the module-level analog of a group's individual `SoonItem`.
type ModuleDef = {
  id: string;
  label: string;
  homeHref: string;
  icon: LucideIcon;
  groups: NavGroupDef[];
  soon?: true;
};

const SALES_NAV_GROUPS: NavGroupDef[] = [
  {
    id: "cycle",
    label: "Sales cycle",
    icon: Workflow,
    items: [
      { href: "/sales/quotations", label: "Quotations", icon: FilePenLine },
      { href: "/sales/orders", label: "Sales Orders", icon: ClipboardList },
      { href: "/sales/pick-lists", label: "Pick Lists", icon: PackageCheck },
      { href: "/sales/delivery-notes", label: "Delivery Notes", icon: Truck },
      { href: "/sales/invoices", label: "Sales Invoices", icon: ReceiptText },
      { label: "Customer Payments", icon: Wallet, soon: true },
    ],
  },
  {
    id: "returns",
    label: "Returns & credits",
    icon: Undo2,
    items: [
      { label: "Sales Returns", icon: PackageOpen, soon: true },
      { label: "Credit Notes", icon: FileMinus, soon: true },
    ],
  },
  {
    id: "contacts",
    label: "Customers & contacts",
    icon: Users,
    items: [
      { href: "/master-data/customers", label: "Customers", icon: Building2 },
      { href: "/master-data/contacts", label: "Contacts", icon: Contact },
      { href: "/master-data/addresses", label: "Addresses", icon: MapPin },
      { href: "/master-data/customer-groups", label: "Customer Groups", icon: UsersRound },
    ],
  },
  {
    id: "items",
    label: "Items & pricing",
    icon: Package,
    items: [
      { href: "/master-data/items", label: "Items", icon: Box },
      { href: "/master-data/item-groups", label: "Item Groups", icon: Boxes },
      { href: "/master-data/price-lists", label: "Price Lists", icon: Tags },
    ],
  },
  {
    id: "marketing",
    label: "Sales & marketing",
    icon: Megaphone,
    items: [
      { href: "/sales/campaigns", label: "Campaigns", icon: Megaphone },
      { href: "/sales/sales-partners", label: "Sales Partners", icon: Handshake },
    ],
  },
  {
    id: "reports",
    label: "Sales reports",
    icon: ChartNoAxesCombined,
    items: [{ href: "/reports", label: "Sales Reports", icon: ChartNoAxesCombined }],
  },
  {
    id: "setup",
    label: "Sales setup",
    icon: Settings2,
    items: [
      { href: "/sales/sales-persons", label: "Sales Team", icon: UserRound },
      { href: "/master-data/territories", label: "Territories", icon: Map },
      { href: "/sales/settings", label: "Selling Settings", icon: SlidersHorizontal },
    ],
  },
];

// Phase 3 of the Buying + multi-module nav plan: the first real Buying nav group —
// Suppliers master plus the shared Contacts/Addresses pages (those two are generic
// Frappe doctypes, not Customer-exclusive, so Buying points at the same canonical
// /master-data/contacts and /master-data/addresses routes rather than forking its own
// copies). Material Requests, RFQs, Purchase Orders, etc. land in later phases as those
// doctypes are built. Suppliers/Contacts/Addresses all repointed at their canonical
// /master-data/* routes by the Business Partner domain package, 2026-09-19.
// Phase 4 of the Buying + multi-module nav plan: all six Buying-cycle doctypes now have
// real routes — Material Request -> Request for Quotation -> Supplier Quotation ->
// Purchase Order -> Purchase Receipt -> Purchase Invoice, the full real chain order.
// Ordered first, ahead of the "Suppliers & contacts" group, matching Sales' own group
// ordering convention (cycle group before contacts/masters).
const BUYING_NAV_GROUPS: NavGroupDef[] = [
  {
    id: "cycle",
    label: "Buying cycle",
    icon: Workflow,
    items: [
      { href: "/buying/material-requests", label: "Material Requests", icon: ClipboardList },
      { href: "/buying/request-for-quotations", label: "RFQs", icon: FilePenLine },
      { href: "/buying/supplier-quotations", label: "Supplier Quotations", icon: ReceiptText },
      { href: "/buying/purchase-orders", label: "Purchase Orders", icon: ShoppingCart },
      { href: "/buying/purchase-receipts", label: "Purchase Receipts", icon: PackageCheck },
      { href: "/buying/purchase-invoices", label: "Purchase Invoices", icon: ReceiptText },
    ],
  },
  {
    id: "suppliers",
    label: "Suppliers & contacts",
    icon: Users,
    items: [
      { href: "/master-data/suppliers", label: "Suppliers", icon: Warehouse },
      { href: "/master-data/contacts", label: "Contacts", icon: Contact },
      { href: "/master-data/addresses", label: "Addresses", icon: MapPin },
    ],
  },
  {
    id: "reports",
    label: "Buying reports",
    icon: ChartNoAxesCombined,
    items: [{ href: "/buying/reports", label: "Buying Reports", icon: ChartNoAxesCombined }],
  },
];

// Phase 1 of the Stock + multi-module nav plan: Stock movement (Stock Entries, Stock
// Balance) ordered first, matching every other module's own "cycle group before masters"
// convention. "Items" and "Warehouses" are link-outs to their canonical /master-data/*
// routes (same precedent Buying already set for /master-data/contacts and
// /master-data/addresses) — both are shared masters, not forked per module. Batches/Serial
// Nos stay owned here — per docs/master-data-architecture.md's Batch/Serial
// classification, they're transaction-generated (Frappe's own `reference_doctype`/
// `reference_name` fields on both doctypes, plus Serial No's own Active/Delivered/
// Consumed/Expired lifecycle status, live-confirmed via get_doctype_fields), not static
// masters — Master Data Canonicalization package, 2026-09-18/19.
const STOCK_NAV_GROUPS: NavGroupDef[] = [
  {
    id: "cycle",
    label: "Stock movement",
    icon: Workflow,
    items: [
      { href: "/stock/stock-entries", label: "Stock Entries", icon: ArrowLeftRight },
      { href: "/stock/stock-balance", label: "Stock Balance", icon: Boxes },
    ],
  },
  {
    id: "masters",
    label: "Warehouses & tracking",
    icon: Warehouse,
    items: [
      { href: "/master-data/warehouses", label: "Warehouses", icon: Warehouse },
      { href: "/stock/batches", label: "Batches", icon: Layers },
      { href: "/stock/serial-nos", label: "Serial Nos", icon: ScanBarcode },
      { href: "/master-data/items", label: "Items", icon: Box },
    ],
  },
  {
    id: "reports",
    label: "Stock reports",
    icon: ChartNoAxesCombined,
    items: [{ href: "/stock/reports", label: "Stock Reports", icon: ChartNoAxesCombined }],
  },
];

// First Manufacturing package (2026-09-17): Work Orders list only. No Job Card/BOM/
// Workstation routes exist yet, so this group deliberately holds just the one item rather
// than padding it with "Soon" placeholders not asked for in this package.
const MANUFACTURING_NAV_GROUPS: NavGroupDef[] = [
  {
    id: "cycle",
    label: "Manufacturing",
    icon: Workflow,
    items: [{ href: "/manufacturing/work-orders", label: "Work Orders", icon: ClipboardList }],
  },
];

// Master Data module. Started as a navigation-foundation-only package (MD-1) where every
// item here linked OUT to a route still owned by Sales/Buying/Stock. The Master Data
// Canonicalization package (2026-09-18) moved Items/Item Groups/Price Lists to their own
// canonical /master-data/* routes, the Business Partner domain package (2026-09-19) did
// the same for Customers/Customer Groups/Suppliers/Contacts/Addresses/Territories, and the
// Inventory Structure domain package (also 2026-09-19) did the same for Warehouses —
// every entity below except Batches/Serial Nos is now owned here, not a link-out, and
// every other module that references them (Selling's "Customers & contacts"/"setup"
// groups, Buying's "Suppliers & contacts" group, Selling's own "Items & pricing" group,
// Stock's "Items"/"Warehouses" link-outs, Manufacturing's Work Order detail page) points
// here too. Supplier Group is a real ERPNext doctype (verified live via get_doctype_fields,
// referenced by Supplier.supplier_group) but has no frontend screen at all — building one
// is new feature work, not a relocation, so it's deliberately left out rather than added
// as a dead link; see PROGRESS.md. Batches and Serial Nos remain link-outs to their
// still-Stock-owned routes — per docs/master-data-architecture.md's own classification
// (§2/§7) they're transaction-generated/operational entities, not structural masters, so
// they were deliberately NOT moved alongside Warehouse. The Manufacturing Masters — BOM
// package (2026-09-19, Package 4A) added BOM as this module's first net-new (not moved)
// entity screen — read-only only (no create/edit/delete route exists for BOM in this app).
// Operation and Workstation remain unimplemented — real ERPNext masters with no frontend
// screen at all yet, each its own future, separately authorized package (see
// `docs/backend/05-manufacturing/bom.md`'s Operation/Routing/Workstation classification
// table). Entities with no existing route at all (UOM, Operation, Workstation, Company,
// Cost Center, Project, Currency, Tax, Payment Terms) are deliberately omitted rather than
// padded with "Soon" placeholders — same precedent MANUFACTURING_NAV_GROUPS set.
const MASTER_DATA_NAV_GROUPS: NavGroupDef[] = [
  {
    id: "products",
    label: "Products & pricing",
    icon: Tags,
    items: [
      { href: "/master-data/items", label: "Items", icon: Box },
      { href: "/master-data/item-groups", label: "Item Groups", icon: Tags },
      { href: "/master-data/price-lists", label: "Price Lists", icon: ReceiptText },
    ],
  },
  {
    id: "partners",
    label: "Business partners",
    icon: Handshake,
    items: [
      { href: "/master-data/customers", label: "Customers", icon: UserRound },
      { href: "/master-data/customer-groups", label: "Customer Groups", icon: UsersRound },
      { href: "/master-data/suppliers", label: "Suppliers", icon: Building2 },
      { href: "/master-data/contacts", label: "Contacts", icon: Contact },
      { href: "/master-data/addresses", label: "Addresses", icon: MapPin },
      { href: "/master-data/territories", label: "Territories", icon: Map },
    ],
  },
  {
    id: "inventory-structure",
    label: "Inventory structure",
    icon: Warehouse,
    items: [
      { href: "/master-data/warehouses", label: "Warehouses", icon: Warehouse },
      { href: "/stock/batches", label: "Batches", icon: Layers },
      { href: "/stock/serial-nos", label: "Serial Nos", icon: ScanBarcode },
    ],
  },
  {
    id: "manufacturing-masters",
    label: "Manufacturing masters",
    icon: ListTree,
    items: [{ href: "/master-data/boms", label: "Bills of Materials", icon: ListTree }],
  },
];

const MODULES: ModuleDef[] = [
  { id: "sales", label: "Selling", homeHref: "/sales", icon: ShoppingCart, groups: SALES_NAV_GROUPS },
  { id: "buying", label: "Buying", homeHref: "/buying", icon: ShoppingBag, groups: BUYING_NAV_GROUPS },
  { id: "stock", label: "Inventory", homeHref: "/stock", icon: Boxes, groups: STOCK_NAV_GROUPS },
  { id: "manufacturing", label: "Manufacturing", homeHref: "/manufacturing", icon: Factory, groups: MANUFACTURING_NAV_GROUPS },
  { id: "master-data", label: "Master Data", homeHref: "/master-data", icon: Database, groups: MASTER_DATA_NAV_GROUPS },
];

const DEFAULT_MODULE_ID = "sales";

// "/sales" needs a plain prefix match, same as any other module home — no module's
// homeHref is "/", so (unlike the old single-module Dashboard link) there's no exact-match
// special case needed here anymore. Kept as a named helper because both group items and
// module homeHrefs use it identically.
function isItemActive(pathname: string, href: string): boolean {
  return pathname.startsWith(href);
}

function findActiveGroupId(pathname: string, groups: NavGroupDef[]): string | undefined {
  return groups.find((group) =>
    group.items.some((item) => "href" in item && isItemActive(pathname, item.href)),
  )?.id;
}

// Generic pub-sub-over-localStorage store, read via useSyncExternalStore rather than
// useState+useEffect — same pattern the sidebar already used for its collapse/expand
// state (and ReportsList.tsx's view-mode toggle), just factored once so the newly added
// "last active module" store doesn't need its own copy-pasted listeners/cachedRaw/write
// trio. Lets the server-rendered default and the client's saved preference differ
// without a hydration mismatch or a setState-in-effect cascade.
function createLocalStore<T>(key: string, defaultValue: T, sanitize: (parsed: unknown) => T) {
  const listeners = new Set<() => void>();
  let cachedRaw: string | null | undefined; // undefined = not read yet this session
  let cachedState: T = defaultValue;

  function getSnapshot(): T {
    let raw: string | null;
    try {
      raw = localStorage.getItem(key);
    } catch {
      return defaultValue;
    }
    if (raw === cachedRaw) return cachedState;
    cachedRaw = raw;
    if (!raw) {
      cachedState = defaultValue;
      return cachedState;
    }
    try {
      cachedState = sanitize(JSON.parse(raw));
    } catch {
      cachedState = defaultValue;
    }
    return cachedState;
  }

  function getServerSnapshot(): T {
    return defaultValue;
  }

  function subscribe(callback: () => void) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  }

  function write(state: T) {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // localStorage unavailable (private window, blocked storage) — the change still
      // notifies listeners below, so it works for this render even if it won't persist.
    }
    cachedRaw = undefined; // force a re-read of localStorage on the next getSnapshot() call
    listeners.forEach((l) => l());
  }

  return { getSnapshot, getServerSnapshot, subscribe, write };
}

// Sidebar UI state: which groups are expanded, and rail (collapsed) mode. `collapsed` is
// one shared preference across every module; `expanded` holds entries prefixed
// "<moduleId>:<groupId>" so identically-named group ids in different modules (e.g. if
// Buying later grows its own "cycle" or "setup" group) don't bleed into each other's
// stored expand-state. The group's own `id` field in NAV_GROUPS/MODULES stays a plain
// short string for readability — only the persisted storage key gets prefixed.
const SIDEBAR_STORAGE_KEY = "ceylonstack.sidebar.v1";
type StoredState = { expanded: string[]; collapsed: boolean };
const DEFAULT_STATE: StoredState = { expanded: [`${DEFAULT_MODULE_ID}:cycle`], collapsed: false };

const sidebarStore = createLocalStore<StoredState>(SIDEBAR_STORAGE_KEY, DEFAULT_STATE, (parsed) => {
  const obj = (parsed ?? {}) as { expanded?: unknown; collapsed?: unknown };
  return {
    expanded: Array.isArray(obj.expanded)
      ? obj.expanded.filter((id): id is string => typeof id === "string")
      : DEFAULT_STATE.expanded,
    collapsed: Boolean(obj.collapsed),
  };
});

// Separate, simpler store for "which module did the user last land in" — read as a
// fallback by the active-module resolution below, and written both by the module
// switcher and by directly navigating into a module's own routes.
const ACTIVE_MODULE_STORAGE_KEY = "ceylonstack.activeModule.v1";
const activeModuleStore = createLocalStore<string | null>(ACTIVE_MODULE_STORAGE_KEY, null, (parsed) =>
  typeof parsed === "string" ? parsed : null,
);

export function Sidebar() {
  const pathname = usePathname();
  const stored = useSyncExternalStore(sidebarStore.subscribe, sidebarStore.getSnapshot, sidebarStore.getServerSnapshot);
  const persistedModuleId = useSyncExternalStore(
    activeModuleStore.subscribe,
    activeModuleStore.getSnapshot,
    activeModuleStore.getServerSnapshot,
  );
  // Ephemeral, not persisted — which group's floating flyout (rail/collapsed mode only)
  // is currently open. Mirrors the concept file's single shared `#cs-nav-flyout` panel.
  const [openFlyoutId, setOpenFlyoutId] = useState<string | null>(null);
  // Ephemeral, not persisted — whether the module-switcher dropdown is open.
  const [moduleMenuOpen, setModuleMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  // Bumped on every window resize purely to force a re-render, which re-runs the
  // deps-less fit effect below — the effect itself never reads this value.
  const [, forceRemeasure] = useState(0);

  // Active module: whichever module's homeHref the current route sits under (a real
  // route always wins), falling back to the last module chosen via the switcher — or
  // navigated into directly — and finally to Sales when nothing matches and nothing has
  // been persisted yet (e.g. sitting on the "/" module-picker page on a fresh session).
  const pathModule = MODULES.find((m) => !m.soon && isItemActive(pathname, m.homeHref));
  const activeModule =
    pathModule ??
    MODULES.find((m) => m.id === persistedModuleId) ??
    MODULES.find((m) => m.id === DEFAULT_MODULE_ID)!;

  // Visiting a module's pages directly (not just via the switcher) should also update
  // which module "/" and the sidebar fall back to next time.
  useLayoutEffect(() => {
    if (pathModule && pathModule.id !== persistedModuleId) {
      activeModuleStore.write(pathModule.id);
    }
  }, [pathModule, persistedModuleId]);

  const activeGroupId = findActiveGroupId(pathname, activeModule.groups);
  const modulePrefix = `${activeModule.id}:`;
  const moduleExpandedIds = stored.expanded
    .filter((id) => id.startsWith(modulePrefix))
    .map((id) => id.slice(modulePrefix.length));
  const expanded = new Set(moduleExpandedIds);
  if (activeGroupId) expanded.add(activeGroupId);
  const collapsed = stored.collapsed;
  const flyoutGroup = collapsed ? activeModule.groups.find((g) => g.id === openFlyoutId) : undefined;

  function toggleGroup(id: string) {
    const prefixedId = `${modulePrefix}${id}`;
    // Toggle against the merged (visible) set, not just the persisted one — a group
    // that's force-expanded because it contains the active route still shows as "open"
    // here, so toggling it "closed" correctly records that preference for next time
    // (it'll simply keep re-appearing expanded as long as its route stays active).
    const isOpen = expanded.has(id);
    // Opening a group moves it to the end of stored.expanded, so the fit-check effect
    // below always collapses the *oldest*-opened group first, not this one.
    const next = isOpen
      ? stored.expanded.filter((x) => x !== prefixedId)
      : [...stored.expanded.filter((x) => x !== prefixedId), prefixedId];
    sidebarStore.write({ expanded: next, collapsed: stored.collapsed });
  }

  function toggleCollapsed() {
    setOpenFlyoutId(null);
    sidebarStore.write({ expanded: stored.expanded, collapsed: !stored.collapsed });
  }

  function handleRailGroupClick(id: string) {
    // In rail (icon-only) mode, clicking a group icon shows that group's pages in a
    // floating flyout next to the rail — same interaction as the concept file's
    // showFly()/closeFly() (clicking the same icon again closes it).
    setModuleMenuOpen(false);
    setOpenFlyoutId((current) => (current === id ? null : id));
  }

  function toggleModuleMenu() {
    setOpenFlyoutId(null);
    setModuleMenuOpen((current) => !current);
  }

  function selectModule(id: string) {
    setModuleMenuOpen(false);
    setOpenFlyoutId(null);
    activeModuleStore.write(id);
  }

  // No scrollbar in the nav pane, by design — instead, whenever the expanded groups
  // together take more vertical space than the sidebar has (a short browser window, or
  // several groups opened at once), the oldest-opened group that ISN'T the one containing
  // the active route auto-collapses to make room. Runs via useLayoutEffect (before paint)
  // so an overflowing frame is never actually shown; re-collapsing one group at a time
  // through stored.expanded re-renders this effect again, converging until it fits or
  // only the active group is left open. A window resize alone (no expand/collapse click)
  // still needs to re-trigger this, hence the forceRemeasure listener below — this effect
  // deliberately has no dependency array so it re-checks after every render. It only ever
  // looks at (and collapses within) the *active module's* own expanded groups.
  useLayoutEffect(() => {
    if (collapsed) return; // rail mode has no expandable sub-lists to collapse
    const el = navRef.current;
    if (!el) return;
    if (el.scrollHeight <= el.clientHeight) return;
    // Never auto-collapse the group whose route is active, or the one most recently opened
    // (always the last entry — toggleGroup() appends there) — otherwise, whenever only one
    // group is open, "oldest" and "just clicked" are the same entry, and this effect would
    // immediately close the section the user just opened (or the default-open one on first
    // load) the instant its content doesn't fit. Only groups opened *before* that one are
    // fair game to auto-collapse to make room.
    const collapsible = moduleExpandedIds.slice(0, -1).find((id) => id !== activeGroupId);
    if (!collapsible) return; // nothing left we're allowed to collapse
    sidebarStore.write({
      expanded: stored.expanded.filter((id) => id !== `${modulePrefix}${collapsible}`),
      collapsed: stored.collapsed,
    });
  });

  useLayoutEffect(() => {
    function onResize() {
      forceRemeasure((t) => t + 1);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const dashboardItem: NavItem = {
    href: activeModule.homeHref,
    label: `${activeModule.label} Home`,
    icon: LayoutDashboard,
  };
  const ActiveModuleIcon = activeModule.icon;

  return (
    <aside
      className={`relative flex h-full shrink-0 flex-col overflow-hidden bg-ink text-white transition-[width] ${
        collapsed ? "w-14" : "w-56"
      }`}
    >
      <div className="px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <Image src="/brand/logo-mark-reverse.svg" alt="" width={22} height={22} className="shrink-0" />
            {!collapsed && (
              <span className="truncate text-sm font-semibold tracking-tight">Ceylon Stack</span>
            )}
          </Link>
          {/* Collapse toggle sits at the nav header's right edge, next to the Ceylon Stack
              mark, rather than as a separate row at the very bottom of the sidebar. */}
          {!collapsed && (
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label="Collapse sidebar"
              className="shrink-0 rounded p-1 text-white/50 hover:bg-white/10 hover:text-white"
            >
              <PanelLeftClose size={16} />
            </button>
          )}
        </div>
        {collapsed && (
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label="Expand sidebar"
            className="mt-2 flex w-full items-center justify-center rounded p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
          >
            <PanelLeftOpen size={16} />
          </button>
        )}

        {/* Module switcher — sits right below the logo/collapse row so it reads as part
            of the sidebar's header, not buried among the nav groups below. */}
        {!collapsed ? (
          <button
            type="button"
            onClick={toggleModuleMenu}
            aria-haspopup="menu"
            aria-expanded={moduleMenuOpen}
            className="mt-3 flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-white/80 hover:bg-white/10"
          >
            <ActiveModuleIcon size={16} className="shrink-0 text-signal" />
            <span className="flex-1 truncate text-left font-medium">{activeModule.label}</span>
            <ChevronsUpDown size={14} className="shrink-0 text-white/40" />
          </button>
        ) : (
          <button
            type="button"
            onClick={toggleModuleMenu}
            aria-haspopup="menu"
            aria-expanded={moduleMenuOpen}
            title="Switch module"
            className="mt-2 flex w-full items-center justify-center rounded p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
          >
            <ActiveModuleIcon size={16} />
          </button>
        )}
      </div>

      <nav ref={navRef} className="flex-1 overflow-hidden px-2 py-2">
        <DashboardLink item={dashboardItem} pathname={pathname} collapsed={collapsed} />

        <div className="mt-3 border-t border-white/10 pt-3">
          {activeModule.groups.map((group) => (
            <NavGroupSection
              key={group.id}
              group={group}
              pathname={pathname}
              collapsed={collapsed}
              isExpanded={expanded.has(group.id)}
              isFlyoutOpen={openFlyoutId === group.id}
              onToggle={() => toggleGroup(group.id)}
              onRailClick={() => handleRailGroupClick(group.id)}
            />
          ))}
          {activeModule.groups.length === 0 && !collapsed && (
            <p className="px-2 py-1.5 text-sm text-white/30">Nothing here yet.</p>
          )}
        </div>
      </nav>

      {moduleMenuOpen && (
        <>
          {/* Click-outside-to-close backdrop — same approach as the group flyout below. */}
          <button
            type="button"
            aria-label="Close module menu"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setModuleMenuOpen(false)}
          />
          <div
            className={`fixed z-20 w-56 rounded-lg border border-white/10 bg-ink p-2 shadow-2xl ${
              collapsed ? "left-16 top-16" : "left-4 top-16"
            }`}
          >
            <ul>
              {MODULES.map((mod) => {
                const ModIcon = mod.icon;
                if (mod.soon) {
                  return (
                    <li key={mod.id}>
                      <span className="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-white/30">
                        <ModIcon size={16} className="shrink-0" />
                        <span className="flex-1 truncate">{mod.label}</span>
                        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/40">
                          Soon
                        </span>
                      </span>
                    </li>
                  );
                }
                const isActive = mod.id === activeModule.id;
                return (
                  <li key={mod.id}>
                    <Link
                      href={mod.homeHref}
                      onClick={() => selectModule(mod.id)}
                      className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm ${
                        isActive ? "bg-white/10 font-medium text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <ModIcon size={16} className={`shrink-0 ${isActive ? "text-signal" : ""}`} />
                      <span className="truncate">{mod.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}

      {flyoutGroup && (
        <>
          {/* Click-outside-to-close backdrop — simpler and more robust here than a
              document click-listener + ref-exclusion dance. */}
          <button
            type="button"
            aria-label="Close section menu"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpenFlyoutId(null)}
          />
          <div className="fixed left-16 top-20 z-20 w-64 rounded-lg border border-white/10 bg-ink p-3 shadow-2xl">
            <div className="mb-2 flex items-center justify-between gap-2 px-1">
              <span className="text-sm font-semibold text-white">{flyoutGroup.label}</span>
              <button
                type="button"
                onClick={() => setOpenFlyoutId(null)}
                aria-label="Close section menu"
                className="grid h-7 w-7 place-items-center rounded text-white/50 hover:bg-white/10 hover:text-white"
              >
                <X size={15} />
              </button>
            </div>
            <ul>
              {flyoutGroup.items.map((item) => {
                const ItemIcon = item.icon;
                if ("soon" in item) {
                  return (
                    <li key={item.label}>
                      <span className="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-white/30">
                        <ItemIcon size={16} className="shrink-0" />
                        <span className="flex-1 truncate">{item.label}</span>
                        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/40">
                          Soon
                        </span>
                      </span>
                    </li>
                  );
                }
                const active = isItemActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpenFlyoutId(null)}
                      className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm ${
                        active ? "bg-white/10 font-medium text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <ItemIcon size={16} className={`shrink-0 ${active ? "text-signal" : ""}`} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </aside>
  );
}

function DashboardLink({
  item,
  pathname,
  collapsed,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  const active = isItemActive(pathname, item.href);

  if (collapsed) {
    return (
      <Link
        href={item.href}
        title={item.label}
        className={`flex items-center justify-center rounded px-2 py-2 ${
          active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
        }`}
      >
        <Icon size={18} className={active ? "text-signal" : ""} />
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm ${
        active ? "bg-white/10 font-medium text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon size={16} className={`shrink-0 ${active ? "text-signal" : ""}`} />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function NavGroupSection({
  group,
  pathname,
  collapsed,
  isExpanded,
  isFlyoutOpen,
  onToggle,
  onRailClick,
}: {
  group: NavGroupDef;
  pathname: string;
  collapsed: boolean;
  isExpanded: boolean;
  isFlyoutOpen: boolean;
  onToggle: () => void;
  onRailClick: () => void;
}) {
  const GroupIcon = group.icon;
  const groupHasActiveItem = group.items.some((item) => "href" in item && isItemActive(pathname, item.href));

  if (collapsed) {
    return (
      <div className="mt-1 first:mt-0">
        <button
          type="button"
          onClick={onRailClick}
          title={group.label}
          aria-expanded={isFlyoutOpen}
          className={`flex w-full items-center justify-center rounded px-2 py-2 ${
            groupHasActiveItem || isFlyoutOpen
              ? "bg-white/10 text-white"
              : "text-white/60 hover:bg-white/5 hover:text-white"
          }`}
        >
          <GroupIcon size={18} className={groupHasActiveItem ? "text-signal" : ""} />
        </button>
      </div>
    );
  }

  return (
    <div className="mt-1 first:mt-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-white/40 hover:text-white/70"
      >
        <GroupIcon size={14} className="shrink-0" />
        <span className="flex-1 text-left">{group.label}</span>
        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>

      {isExpanded && (
        // Indented and set off with a rule so sub-items read as nested under the group
        // header rather than sitting flush at the same level — not just a plain list.
        <ul className="ml-3 space-y-0.5 border-l border-white/10 pl-2">
          {group.items.map((item) => {
            const ItemIcon = item.icon;

            if ("soon" in item) {
              return (
                <li key={item.label}>
                  <span className="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-white/30">
                    <ItemIcon size={16} className="shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/40">
                      Soon
                    </span>
                  </span>
                </li>
              );
            }

            const active = isItemActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm ${
                    active ? "bg-white/10 font-medium text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <ItemIcon size={16} className={`shrink-0 ${active ? "text-signal" : ""}`} />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
