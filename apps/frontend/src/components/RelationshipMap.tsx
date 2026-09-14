import Link from "next/link";
import { ClipboardList, FilePenLine, ReceiptText, Truck, type LucideIcon } from "lucide-react";
import { StatusPill } from "@/components/StatusPill";
import type { RelationshipNode } from "@/lib/relationshipMap";
import styles from "./RelationshipMap.module.css";

const DOCTYPE_ICON: Record<string, LucideIcon> = {
  Quotation: FilePenLine,
  "Sales Order": ClipboardList,
  "Delivery Note": Truck,
  "Sales Invoice": ReceiptText,
};

function NodeCard({ node }: { node: RelationshipNode }) {
  const Icon = DOCTYPE_ICON[node.doctype] ?? ClipboardList;
  return (
    <Link
      href={node.href}
      className={`flex w-44 flex-col gap-1.5 rounded-md border bg-surface px-3 py-2 text-left shadow-sm transition hover:border-signal ${
        node.isCurrent ? "border-signal ring-1 ring-signal" : "border-border"
      }`}
    >
      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-graphite-500">
        <Icon size={13} />
        {node.doctype}
      </span>
      <span className="truncate font-mono text-sm text-graphite-900">{node.name}</span>
      <StatusPill label={node.status.label} tone={node.status.tone} />
    </Link>
  );
}

function TreeNode({ node }: { node: RelationshipNode }) {
  return (
    <li>
      <NodeCard node={node} />
      {node.children.length > 0 && (
        <ul>
          {node.children.map((child) => (
            <TreeNode key={`${child.doctype}::${child.name}`} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

/** SAP B1-style Relationship Map — the full Quotation -> Sales Order -> Delivery Note ->
 * Sales Invoice chain as a connected tree, not just the current document's one-hop
 * Connections list. `roots` is pre-built server-side by lib/relationshipMap.ts. */
export function RelationshipMap({ roots }: { roots: RelationshipNode[] }) {
  if (roots.length === 0) return <p className="text-sm text-graphite-500">No linked documents.</p>;

  return (
    <div className="space-y-8">
      {roots.map((root) => (
        <div key={`${root.doctype}::${root.name}`} className={styles.tree}>
          <ul>
            <TreeNode node={root} />
          </ul>
        </div>
      ))}
    </div>
  );
}
