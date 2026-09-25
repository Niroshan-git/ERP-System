/**
 * Pure, framework-agnostic follow-up bucket derivation + display map — deliberately NOT in
 * `lib/crmActivity.ts` (which is `server-only`) because both server pages *and* client
 * components (`CrmActivityPanel`, `ActivitiesTable`) need `BUCKET_DISPLAY` as a runtime value,
 * and a client component can never import a `server-only`-guarded module, even for a plain
 * constant. `lib/crmActivity.ts` re-exports `followupBucket`/`FollowupBucket` from here for its
 * existing server-side callers, so this split is invisible to them.
 */
export type FollowupBucket = "overdue" | "due_today" | "upcoming" | "completed" | "no_due_date";

export const BUCKET_DISPLAY: Record<FollowupBucket, { label: string; tone: "success" | "alert" | "signal" | "neutral" }> = {
  overdue: { label: "Overdue", tone: "alert" },
  due_today: { label: "Due Today", tone: "signal" },
  upcoming: { label: "Upcoming", tone: "neutral" },
  completed: { label: "Completed", tone: "success" },
  no_due_date: { label: "No Due Date", tone: "neutral" },
};

function todayMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Derives Overdue/Due Today/Upcoming/Completed the same way `lib/erpStatus.ts`'s
 * `isOverdue()` already derives Sales Order's cosmetic "Overdue" label — recomputed from a
 * live date comparison, never stored, since neither ToDo nor Event carries this as a real
 * field. `openStatus` is the doctype's own "still open" value ("Open" for both ToDo and
 * Event) — anything else (Closed/Cancelled/Completed) is treated as `completed` regardless
 * of date.
 */
export function followupBucket(
  dateStr: string | undefined | null,
  status: string,
  openStatus: string = "Open",
): FollowupBucket {
  if (status !== openStatus) return "completed";
  if (!dateStr) return "no_due_date";
  const due = new Date(dateStr);
  if (Number.isNaN(due.getTime())) return "no_due_date";
  due.setHours(0, 0, 0, 0);
  const today = todayMidnight();
  if (due.getTime() < today.getTime()) return "overdue";
  if (due.getTime() === today.getTime()) return "due_today";
  return "upcoming";
}
