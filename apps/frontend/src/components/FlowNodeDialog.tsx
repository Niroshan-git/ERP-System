"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowUpRight, X } from "lucide-react";
import type { FlowNodePlacement, FlowRecord, FlowScene } from "@/lib/flowMap";

export type SelectedFlowNode<K extends string> = { record: FlowRecord<K>; placement: FlowNodePlacement<K> };

function relatedNodes<K extends string, S extends string>(
  scene: FlowScene<K, S>,
  placement: FlowNodePlacement<K>,
): FlowNodePlacement<K>[] {
  const ids: string[] = [placement.order, placement.key];
  return scene.edges
    .filter((e) => ids.includes(e.from) || ids.includes(e.to))
    .map((e) => {
      const otherId = ids.includes(e.from) ? e.to : e.from;
      return scene.nodes.find((n) => n.order === otherId || n.key === otherId);
    })
    .filter((n): n is FlowNodePlacement<K> => Boolean(n) && n !== placement);
}

/** Detail modal for a selected Flow Map stage — native <dialog> (free focus-trapping and
 * Esc-to-close from the browser, no extra dependency). Generic over a module's own node-key/
 * scene-id unions so `SalesFlowMap`/`ManufacturingFlowMap`'s data can share this one rendering
 * implementation instead of each forking their own copy — see `lib/flowMap.ts`'s doc comment. */
export function FlowNodeDialog<K extends string, S extends string>({
  scene,
  records,
  selected,
  onClose,
  onSelect,
}: {
  scene: FlowScene<K, S>;
  records: Record<K, FlowRecord<K>>;
  selected: SelectedFlowNode<K> | null;
  onClose: () => void;
  onSelect: (placement: FlowNodePlacement<K>) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (selected && !dialog.open) dialog.showModal();
    if (!selected && dialog.open) dialog.close();
  }, [selected]);

  const record = selected?.record;
  const placement = selected?.placement;
  const Icon = record?.icon;
  const related = placement ? relatedNodes(scene, placement) : [];

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-auto w-full max-w-md rounded-2xl border border-border bg-surface p-0 shadow-2xl backdrop:bg-ink/50 backdrop:backdrop-blur-sm"
    >
      {record && Icon && placement && (
        <>
          <div className="flex items-start justify-between gap-4 border-b border-border p-5">
            <div>
              <div className="mb-3" style={{ color: "var(--signal)" }}>
                <Icon size={28} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-graphite-500">
                {record.area} · {record.kind}
              </p>
              <h2 className="text-lg font-semibold text-graphite-900">{record.title}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close stage details"
              className="rounded p-1.5 text-graphite-500 hover:bg-canvas hover:text-graphite-900"
            >
              <X size={18} />
            </button>
          </div>

          <div className="max-h-[60vh] space-y-3 overflow-y-auto p-5">
            <p className="text-sm text-graphite-900">{record.purpose}</p>

            <h3 className="pt-2 text-xs font-semibold uppercase tracking-wide text-graphite-500">
              Inventory &amp; accounting
            </h3>
            <ul className="list-disc space-y-1 pl-5 text-sm text-graphite-500">
              {record.effects.map((effect) => (
                <li key={effect}>{effect}</li>
              ))}
            </ul>

            <h3 className="pt-2 text-xs font-semibold uppercase tracking-wide text-graphite-500">Process rule</h3>
            <p className="text-sm text-graphite-500">{record.note}</p>

            {related.length > 0 && (
              <>
                <h3 className="pt-2 text-xs font-semibold uppercase tracking-wide text-graphite-500">
                  Connected stages
                </h3>
                <div className="flex flex-wrap gap-2">
                  {related.map((n) => (
                    <button
                      key={`${n.key}-${n.order}`}
                      type="button"
                      onClick={() => onSelect(n)}
                      className="rounded-md border border-border bg-canvas px-2.5 py-1.5 text-xs font-medium text-graphite-900 hover:border-signal"
                    >
                      {records[n.key].title}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="border-t border-border p-5">
            {record.href ? (
              <Link
                href={record.href}
                className="flex items-center justify-center gap-2 rounded-md bg-signal px-4 py-2.5 text-sm font-semibold text-white hover:bg-signal/90"
              >
                Open {record.title}
                <ArrowUpRight size={16} />
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="flex w-full cursor-default items-center justify-center gap-2 rounded-md bg-graphite-500/15 px-4 py-2.5 text-sm font-semibold text-graphite-500"
              >
                Coming soon
              </button>
            )}
            <p className="mt-2 text-center text-xs text-graphite-500">
              {record.href ? "Navigates to the real page." : "This stage isn't built in Ceylon Stack yet."}
            </p>
          </div>
        </>
      )}
    </dialog>
  );
}
