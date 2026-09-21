"use client";

import { type ReactNode, useState } from "react";
import { ArrowUpRight, RotateCcw } from "lucide-react";
import { FlowNodeDialog, type SelectedFlowNode } from "@/components/FlowNodeDialog";
import type { FlowNodePlacement, FlowRecord, FlowScene } from "@/lib/flowMap";

/** Rough label-chip width from character count — the source concept hand-measured every
 * edge label's pixel width; this just needs to look right, not be exact. */
function chipWidth(label: string): number {
  return label.length * 6 + 16;
}

/**
 * SAP B1-style process map: pick a scene, click a stage to see how it works. Generic over a
 * module's own node-key/scene-id unions — see `lib/flowMap.ts`'s doc comment for why this is
 * one shared component (matching the `LineChart` pattern) rather than a `SalesFlowMap`/
 * `ManufacturingFlowMap` fork each maintaining its own copy of this rendering/interaction code.
 * Layout (1200x{height} viewBox, node/edge coordinates) is caller-supplied data — this
 * component only renders it, using this app's own design tokens (globals.css) so it follows
 * the real light/dark toggle automatically.
 */
export function FlowMap<K extends string, S extends string>({
  records,
  scenes,
  sceneOrder,
  defaultScene,
  idPrefix,
  downloadFilePrefix,
  tablistLabel,
  notes,
}: {
  records: Record<K, FlowRecord<K>>;
  scenes: Record<S, FlowScene<K, S>>;
  sceneOrder: S[];
  defaultScene: S;
  /** Prefixes the SVG element id and the arrow-marker id, so multiple `FlowMap`s on the same
   * page (or across client-side navigations) never collide in the DOM. */
  idPrefix: string;
  /** Prefixes the downloaded SVG's filename, e.g. `ceylonstack-sales-flow`. */
  downloadFilePrefix: string;
  /** aria-label for the scene-picker tablist, e.g. "Sales process variants". */
  tablistLabel: string;
  /** Module-specific "Process notes & references" content shown in the collapsible footer. */
  notes: ReactNode;
}) {
  const [sceneId, setSceneId] = useState<S>(defaultScene);
  const [selected, setSelected] = useState<SelectedFlowNode<K> | null>(null);
  const scene = scenes[sceneId];

  function changeScene(id: S) {
    setSceneId(id);
    setSelected(null);
  }

  function openNode(placement: FlowNodePlacement<K>) {
    setSelected({ record: records[placement.key], placement });
  }

  function downloadSvg() {
    const svg = document.getElementById(`${idPrefix}-svg-${sceneId}`);
    if (!svg) return;
    const data = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([data], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${downloadFilePrefix}-${sceneId}.svg`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={tablistLabel}>
          {sceneOrder.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={sceneId === id}
              onClick={() => changeScene(id)}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                sceneId === id
                  ? "bg-signal/10 text-signal"
                  : "text-graphite-500 hover:bg-canvas hover:text-graphite-900"
              }`}
            >
              {scenes[id].name}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => changeScene(defaultScene)}
          className="flex items-center gap-1.5 text-sm text-graphite-500 hover:text-graphite-900"
        >
          <RotateCcw size={14} />
          Reset view
        </button>
      </div>

      <div className="mb-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-graphite-900">{scene.title}</h2>
          <p className="mt-1 max-w-2xl text-sm text-graphite-500">{scene.hint}</p>
        </div>
        <div className="flex shrink-0 gap-4 pt-1 text-xs text-graphite-500">
          <span className="flex items-center gap-1.5">
            <span className="block h-3 w-5 rounded-sm border border-graphite-500" />
            Core / context
          </span>
          <span className="flex items-center gap-1.5">
            <span className="block h-3 w-5 rounded-sm border border-dashed border-graphite-500" />
            Optional / conditional
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl" style={{ background: "var(--canvas)" }}>
        <svg
          id={`${idPrefix}-svg-${sceneId}`}
          viewBox={`0 0 1200 ${scene.height}`}
          width={1200}
          height={scene.height}
          className="block w-full min-w-[900px]"
          role="group"
          aria-label={scene.title}
        >
          <defs>
            <marker id={`cs-${idPrefix}-arrow`} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M1 1 L6 4 L1 7" fill="none" stroke="var(--graphite-500)" strokeWidth="1.4" />
            </marker>
          </defs>
          <rect width={1200} height={scene.height} rx={18} fill="var(--canvas)" />

          {scene.lanes.map((lane) => (
            <text key={lane.label} x={lane.x} y={lane.y} fill="var(--graphite-500)" fontSize={12} letterSpacing={2}>
              {lane.label}
            </text>
          ))}

          {scene.edges.map((edge, i) => {
            const ids: string[] = selected ? [selected.placement.order, selected.placement.key] : [];
            const isRelated = selected && (ids.includes(edge.from) || ids.includes(edge.to));
            const isDimmed = selected && !isRelated;
            const w = edge.label ? chipWidth(edge.label) : 0;
            return (
              <g key={`${edge.from}-${edge.to}-${i}`} style={{ opacity: isDimmed ? 0.25 : 1 }}>
                <path
                  d={edge.path}
                  fill="none"
                  stroke={isRelated ? "var(--signal)" : "var(--graphite-500)"}
                  strokeOpacity={isRelated ? 1 : 0.55}
                  strokeWidth={isRelated ? 2.4 : 1.5}
                  strokeDasharray={edge.optional ? "5 5" : undefined}
                  markerEnd={`url(#cs-${idPrefix}-arrow)`}
                />
                {edge.label && edge.lx !== undefined && edge.ly !== undefined && (
                  <>
                    <rect x={edge.lx - w / 2} y={edge.ly - 9} width={w} height={18} rx={4} fill="var(--canvas)" />
                    <text x={edge.lx} y={edge.ly + 4} textAnchor="middle" fill="var(--graphite-500)" fontSize={11}>
                      {edge.label}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {scene.nodes.map((placement) => {
            const record = records[placement.key];
            const Icon = record.icon;
            const soon = record.href === null;
            const isSelected = selected?.placement === placement;
            return (
              <g
                key={`${placement.key}-${placement.order}`}
                transform={`translate(${placement.x} ${placement.y})`}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                aria-label={`${record.title}, ${record.kind}`}
                className="cursor-pointer outline-none"
                style={{ opacity: soon ? 0.7 : 1 }}
                onClick={() => openNode(placement)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openNode(placement);
                  }
                }}
              >
                <rect
                  width={218}
                  height={132}
                  rx={12}
                  fill="var(--surface)"
                  stroke={isSelected ? "var(--signal)" : "var(--border)"}
                  strokeWidth={isSelected ? 2 : 1}
                  strokeDasharray={placement.optional ? "4 3" : undefined}
                />
                <g transform="translate(19 19)" style={{ color: "var(--signal)" }}>
                  <Icon width={30} height={30} />
                </g>
                <text x={196} y={34} textAnchor="end" fill="var(--graphite-500)" fontSize={11}>
                  {placement.order}
                </text>
                <text x={18} y={78} fill="var(--graphite-900)" fontSize={placement.titleSize ?? 16} fontWeight={600}>
                  {record.title}
                </text>
                <text x={18} y={99} fill="var(--graphite-500)" fontSize={12}>
                  {record.subtitle}
                </text>
                <text x={18} y={119} fill={soon ? "var(--graphite-500)" : "var(--signal)"} fontSize={10}>
                  {record.kind}
                  {soon ? " · Coming soon" : ""}
                </text>
              </g>
            );
          })}

          {scene.shortcuts.map((shortcut, i) => (
            <g
              key={shortcut.scene}
              transform={`translate(${42 + i * 400} 516)`}
              role="button"
              tabIndex={0}
              aria-label={shortcut.label}
              className="cursor-pointer outline-none"
              onClick={() => changeScene(shortcut.scene)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  changeScene(shortcut.scene);
                }
              }}
            >
              <rect width={318} height={60} rx={10} fill="var(--surface)" stroke="var(--border)" />
              <text x={16} y={23} fill="var(--graphite-500)" fontSize={11}>
                {shortcut.area}
              </text>
              <text x={16} y={44} fill="var(--graphite-900)" fontSize={14}>
                {shortcut.label}
              </text>
              <g transform="translate(282 19)" style={{ color: "var(--signal)" }}>
                <ArrowUpRight width={20} height={20} />
              </g>
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-graphite-500">
        <p>{scene.note}</p>
        <button type="button" onClick={downloadSvg} className="shrink-0 underline underline-offset-2 hover:text-graphite-900">
          Download this view as SVG
        </button>
      </div>

      <details className="mt-4 text-graphite-500">
        <summary className="cursor-pointer text-xs">Process notes &amp; references</summary>
        <div className="mt-2 max-w-3xl space-y-2 text-xs">{notes}</div>
      </details>

      <FlowNodeDialog scene={scene} records={records} selected={selected} onClose={() => setSelected(null)} onSelect={openNode} />
    </div>
  );
}
