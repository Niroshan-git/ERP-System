"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import {
  Box,
  Boxes,
  Building2,
  ChartNoAxesCombined,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Contact,
  FileMinus,
  FilePenLine,
  Handshake,
  LayoutDashboard,
  Map,
  MapPin,
  Megaphone,
  Package,
  PackageOpen,
  PanelLeftClose,
  PanelLeftOpen,
  ReceiptText,
  Settings2,
  SlidersHorizontal,
  Tags,
  Truck,
  Undo2,
  UserRound,
  Users,
  UsersRound,
  Wallet,
  Workflow,
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

const NAV_GROUPS: NavGroupDef[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    items: [{ href: "/", label: "Sales Dashboard", icon: LayoutDashboard }],
  },
  {
    id: "cycle",
    label: "Sales cycle",
    icon: Workflow,
    items: [
      { href: "/sales/quotations", label: "Quotations", icon: FilePenLine },
      { href: "/sales/orders", label: "Sales Orders", icon: ClipboardList },
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
      { href: "/sales/customers", label: "Customers", icon: Building2 },
      { href: "/sales/contacts", label: "Contacts", icon: Contact },
      { href: "/sales/addresses", label: "Addresses", icon: MapPin },
      { href: "/sales/customer-groups", label: "Customer Groups", icon: UsersRound },
    ],
  },
  {
    id: "items",
    label: "Items & pricing",
    icon: Package,
    items: [
      { href: "/sales/items", label: "Items", icon: Box },
      { href: "/sales/item-groups", label: "Item Groups", icon: Boxes },
      { href: "/sales/price-lists", label: "Price Lists", icon: Tags },
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
      { href: "/sales/territories", label: "Territories", icon: Map },
      { href: "/sales/settings", label: "Selling Settings", icon: SlidersHorizontal },
    ],
  },
];

const DEFAULT_EXPANDED = ["cycle"];
const STORAGE_KEY = "ceylonstack.sidebar.v1";

type StoredState = { expanded: string[]; collapsed: boolean };

const DEFAULT_STATE: StoredState = { expanded: DEFAULT_EXPANDED, collapsed: false };

// "/" (Sales Dashboard) needs an exact match — pathname.startsWith("/") would otherwise
// match every route in the app, since every path starts with "/".
function isItemActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function findActiveGroupId(pathname: string): string | undefined {
  return NAV_GROUPS.find((group) =>
    group.items.some((item) => "href" in item && isItemActive(pathname, item.href)),
  )?.id;
}

// Module-level pub-sub over localStorage, read via useSyncExternalStore rather than
// useState+useEffect — same pattern as ReportsList.tsx's view-mode toggle: it lets the
// server-rendered default (rail expanded, only "Sales cycle" open) and the client's
// saved preference differ without a hydration mismatch or a setState-in-effect cascade.
const listeners = new Set<() => void>();

let cachedRaw: string | null | undefined; // undefined = not read yet this session
let cachedState: StoredState = DEFAULT_STATE;

function getSnapshot(): StoredState {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return DEFAULT_STATE;
  }
  if (raw === cachedRaw) return cachedState;
  cachedRaw = raw;
  if (!raw) {
    cachedState = DEFAULT_STATE;
    return cachedState;
  }
  try {
    const parsed = JSON.parse(raw);
    cachedState = {
      expanded: Array.isArray(parsed.expanded)
        ? parsed.expanded.filter((id: unknown): id is string => typeof id === "string")
        : DEFAULT_EXPANDED,
      collapsed: Boolean(parsed.collapsed),
    };
  } catch {
    cachedState = DEFAULT_STATE;
  }
  return cachedState;
}

function getServerSnapshot(): StoredState {
  return DEFAULT_STATE;
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function writeStoredState(state: StoredState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable (private window, blocked storage) — the click still
    // notifies listeners below, so the toggle works for this render even if it won't persist.
  }
  cachedRaw = undefined; // force a re-read of localStorage on the next getSnapshot() call
  listeners.forEach((l) => l());
}

export function Sidebar() {
  const pathname = usePathname();
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const activeGroupId = findActiveGroupId(pathname);
  const expanded = new Set(stored.expanded);
  if (activeGroupId) expanded.add(activeGroupId);
  const collapsed = stored.collapsed;

  function toggleGroup(id: string) {
    // Toggle against the merged (visible) set, not just the persisted one — a group
    // that's force-expanded because it contains the active route still shows as "open"
    // here, so toggling it "closed" correctly records that preference for next time
    // (it'll simply keep re-appearing expanded as long as its route stays active).
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    writeStoredState({ expanded: [...next], collapsed: stored.collapsed });
  }

  function toggleCollapsed() {
    writeStoredState({ expanded: stored.expanded, collapsed: !stored.collapsed });
  }

  function handleRailGroupClick(id: string) {
    // In rail (icon-only) mode, clicking a group icon just expands the group and
    // un-collapses the rail, rather than a hover-flyout popover.
    const next = new Set(expanded);
    next.add(id);
    writeStoredState({ expanded: [...next], collapsed: false });
  }

  return (
    <aside
      className={`flex shrink-0 flex-col bg-graphite-900 text-white transition-[width] ${
        collapsed ? "w-14" : "w-56"
      }`}
    >
      <div className="flex items-center gap-2 px-4 py-4">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <Image src="/brand/logo-mark-reverse.svg" alt="" width={22} height={22} className="shrink-0" />
          {!collapsed && (
            <span className="truncate text-sm font-semibold tracking-tight">Ceylon Stack</span>
          )}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-2">
        {NAV_GROUPS.map((group) => (
          <NavGroupSection
            key={group.id}
            group={group}
            pathname={pathname}
            collapsed={collapsed}
            isExpanded={expanded.has(group.id)}
            onToggle={() => toggleGroup(group.id)}
            onRailClick={() => handleRailGroupClick(group.id)}
          />
        ))}

        {!collapsed && (
          <>
            <p className="mt-4 px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-white/30">
              Manufacturing
            </p>
            <p className="px-2 py-1.5 text-sm text-white/30">Coming soon</p>
          </>
        )}
      </nav>

      <div className="border-t border-white/10 px-2 py-2">
        <button
          type="button"
          onClick={toggleCollapsed}
          className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-white/60 hover:bg-white/5 hover:text-white ${
            collapsed ? "justify-center" : ""
          }`}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

function NavGroupSection({
  group,
  pathname,
  collapsed,
  isExpanded,
  onToggle,
  onRailClick,
}: {
  group: NavGroupDef;
  pathname: string;
  collapsed: boolean;
  isExpanded: boolean;
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
          className={`flex w-full items-center justify-center rounded px-2 py-2 ${
            groupHasActiveItem ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
          }`}
        >
          <GroupIcon size={18} />
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
        <ul>
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
