import Link from "next/link";
import type { Connection } from "@/lib/connections";
import { DocActionBar } from "@/components/DocActionBar";

type DocActionState = { error?: string } | undefined;

export function ConnectionsPanel({
  connections,
  createAction,
}: {
  connections: Connection[];
  createAction?:
    | { label: string; action: (state: DocActionState, formData: FormData) => Promise<DocActionState> }
    /** Link variant — used when "Create X" needs an intermediate step (e.g. line
     * selection for partial fulfillment) rather than a single-click submit. */
    | { label: string; href: string };
}) {
  if (connections.length === 0 && !createAction) {
    return <p className="text-sm text-graphite-500">No linked documents.</p>;
  }

  return (
    <div className="space-y-6">
      {createAction &&
        ("href" in createAction ? (
          <Link
            href={createAction.href}
            className="inline-block rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90"
          >
            {createAction.label}
          </Link>
        ) : (
          <DocActionBar action={createAction.action} label={createAction.label} pendingLabel="Creating…" />
        ))}

      {connections.map((connection) => (
        <div key={connection.label}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-graphite-500">
            {connection.label}
          </h3>
          {connection.docs.length === 0 ? (
            <p className="text-sm text-graphite-500">None yet.</p>
          ) : (
            <ul className="space-y-1">
              {connection.docs.map((docName) => (
                <li key={docName}>
                  <Link
                    href={`${connection.href}/${encodeURIComponent(docName)}`}
                    className="font-mono text-sm text-signal hover:underline"
                  >
                    {docName}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
