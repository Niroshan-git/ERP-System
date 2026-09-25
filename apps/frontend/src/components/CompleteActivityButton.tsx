"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * Row-level "Complete" action for `/crm/activities` — a tiny standalone client component
 * (rather than making the whole `ActivitiesTable` responsible for pending state) since
 * `DataTable`'s column `render()` only returns a `ReactNode`, not a place to hook a shared
 * `useTransition`. `docName` is a `ToDo` name for Follow-up rows or an `Event` name for Meeting
 * rows — `action` is bound to the matching `completeFollowupAction`/`completeMeetingAction` by
 * the caller, this component doesn't know which doctype it's completing.
 */
export function CompleteActivityButton({
  docName,
  action,
}: {
  docName: string;
  action: (docName: string) => Promise<{ error?: string }>;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await action(docName);
          router.refresh();
        })
      }
      className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-graphite-900 hover:bg-canvas disabled:opacity-60"
    >
      {isPending ? "Completing…" : "Complete"}
    </button>
  );
}
