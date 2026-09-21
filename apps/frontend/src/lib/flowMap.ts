import type { LucideIcon } from "lucide-react";

/**
 * Generic shape behind the shared `FlowMap`/`FlowNodeDialog` components (see
 * `docs/controls/FRONTEND_GUIDE.md` §7's "Dashboard" component list). Originally introduced
 * as Sales-specific types directly inside `salesFlowMap.ts`; generalized here 2026-09-21 when
 * the Manufacturing Flow map was added, so both `salesFlowMap.ts` and `manufacturingFlowMap.ts`
 * can supply their own per-module *data* (records/scenes) against one shared, generic
 * *component* — matching this app's established `LineChart` pattern (one generic component,
 * consumed directly by pages with different data) rather than forking a second copy of the
 * rendering/interaction code per module.
 *
 * `K` is the module's own node-key union (e.g. Sales' `FlowNodeKey`, Manufacturing's
 * `MfgFlowNodeKey`); `S` is its scene-id union.
 */

export type FlowRecord<K extends string> = {
  key: K;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  kind: string;
  area: string;
  href: string | null;
  purpose: string;
  effects: string[];
  note: string;
};

export type FlowEdge = {
  from: string;
  to: string;
  path: string;
  label?: string;
  lx?: number;
  ly?: number;
  optional?: boolean;
};

export type FlowNodePlacement<K extends string> = {
  key: K;
  x: number;
  y: number;
  order: string;
  optional?: boolean;
  titleSize?: number;
};

export type FlowShortcut<S extends string> = { area: string; label: string; scene: S };

export type FlowScene<K extends string, S extends string> = {
  id: S;
  name: string;
  title: string;
  hint: string;
  height: number;
  lanes: { label: string; x: number; y: number }[];
  nodes: FlowNodePlacement<K>[];
  edges: FlowEdge[];
  shortcuts: FlowShortcut<S>[];
  note: string;
};
