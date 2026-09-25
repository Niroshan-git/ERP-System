"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { StatusPill } from "@/components/StatusPill";
import { BUCKET_DISPLAY, type FollowupBucket } from "@/lib/followupBucket";
import type { CrmTimelineEntry } from "@/lib/crmActivity";

type ActivityFormState = { error?: string } | undefined;
type BoundActivityAction = (state: ActivityFormState, formData: FormData) => Promise<ActivityFormState>;

export type NextFollowupInfo = {
  todoName: string;
  description: string;
  dueDate?: string;
  bucket: FollowupBucket;
};

export type OpenFollowupInfo = NextFollowupInfo & { assignedTo?: string };

const KIND_DISPLAY: Record<CrmTimelineEntry["kind"], string> = {
  call: "Call",
  meeting: "Meeting",
  followup: "Follow-up",
  note: "Note",
  system: "",
};

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function dayLabel(dateStr: string): string {
  const date = new Date(dateStr.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return "Unknown date";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function timeLabel(dateStr: string): string {
  const date = new Date(dateStr.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function SubForm({
  action,
  submitLabel,
  pendingLabel,
  onSuccess,
  children,
}: {
  action: BoundActivityAction;
  submitLabel: string;
  pendingLabel: string;
  onSuccess: () => void;
  children: React.ReactNode;
}) {
  const [state, formAction, isPending] = useActionState<ActivityFormState, FormData>(async (prev, fd) => {
    const result = await action(prev, fd);
    if (!result?.error) onSuccess();
    return result;
  }, undefined);

  return (
    <form action={formAction} className="space-y-3">
      {children}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-signal px-3 py-1.5 text-sm font-medium text-white hover:bg-signal/90 disabled:opacity-60"
        >
          {isPending ? pendingLabel : submitLabel}
        </button>
        {state?.error && <span className="text-sm text-alert">{state.error}</span>}
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-md border border-border bg-canvas px-2.5 py-1.5 text-sm text-graphite-900 focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal";

export function CrmActivityPanel({
  currentUserFullName,
  currentUserEmail,
  userOptions,
  timeline,
  nextFollowup,
  openFollowups,
  logCallAction,
  scheduleMeetingAction,
  createFollowupAction,
  addNoteAction,
  completeFollowupAction,
  postComment,
}: {
  currentUserFullName: string;
  currentUserEmail: string;
  userOptions: string[] | null;
  timeline: CrmTimelineEntry[];
  nextFollowup: NextFollowupInfo | null;
  openFollowups: OpenFollowupInfo[];
  logCallAction: BoundActivityAction;
  scheduleMeetingAction: BoundActivityAction;
  createFollowupAction: BoundActivityAction;
  addNoteAction: BoundActivityAction;
  completeFollowupAction: (todoName: string) => Promise<{ error?: string }>;
  postComment: (message: string) => Promise<{ error?: string }>;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [addType, setAddType] = useState<"call" | "meeting" | "followup" | "note">("followup");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const commentRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const grouped = useMemo(() => {
    const groups: { label: string; entries: CrmTimelineEntry[] }[] = [];
    for (const entry of timeline) {
      const label = dayLabel(entry.timestamp);
      const last = groups[groups.length - 1];
      if (last && last.label === label) last.entries.push(entry);
      else groups.push({ label, entries: [entry] });
    }
    return groups;
  }, [timeline]);

  function closeAndRefresh() {
    setAddOpen(false);
    router.refresh();
  }

  function submitComment() {
    const value = commentRef.current?.value.trim();
    if (!value) return;
    startTransition(async () => {
      const result = await postComment(value);
      if (result.error) {
        setCommentError(result.error);
        return;
      }
      setCommentError(null);
      if (commentRef.current) commentRef.current.value = "";
      router.refresh();
    });
  }

  function handleComplete(todoName: string) {
    setCompletingId(todoName);
    startTransition(async () => {
      await completeFollowupAction(todoName);
      setCompletingId(null);
      router.refresh();
    });
  }

  const remainingOpenFollowups = openFollowups.filter((f) => f.todoName !== nextFollowup?.todoName);

  return (
    <div className="max-w-3xl space-y-6">
      {/* Next Follow-up */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-graphite-900">Next Follow-up</h2>
          <button
            type="button"
            onClick={() => setAddOpen((v) => !v)}
            className="rounded-md border border-signal px-3 py-1.5 text-sm font-medium text-signal hover:bg-signal/10"
          >
            {addOpen ? "Close" : "+ Add Activity"}
          </button>
        </div>
        {nextFollowup ? (
          <div className="flex items-center gap-2 text-sm">
            <StatusPill label={BUCKET_DISPLAY[nextFollowup.bucket].label} tone={BUCKET_DISPLAY[nextFollowup.bucket].tone} />
            <span className="text-graphite-900">{nextFollowup.description}</span>
            {nextFollowup.dueDate && <span className="text-graphite-500">— {nextFollowup.dueDate}</span>}
          </div>
        ) : (
          <p className="text-sm text-graphite-500">No follow-up scheduled.</p>
        )}
      </div>

      {/* Add Activity */}
      {addOpen && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-3 flex gap-2 border-b border-border pb-2">
            {(["followup", "call", "meeting", "note"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setAddType(t)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  addType === t ? "bg-signal text-white" : "text-graphite-500 hover:bg-canvas"
                }`}
              >
                {t === "followup" ? "Follow-up" : t === "call" ? "Log Call" : t === "meeting" ? "Schedule Meeting" : "Add Note"}
              </button>
            ))}
          </div>

          {addType === "call" && (
            <SubForm action={logCallAction} submitLabel="Log Call" pendingLabel="Logging…" onSuccess={closeAndRefresh}>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-graphite-500">Subject</span>
                <input type="text" name="subject" required className={inputClass} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-graphite-500">Direction</span>
                <select name="sent_or_received" defaultValue="Sent" className={inputClass}>
                  <option value="Sent">Outbound (we called)</option>
                  <option value="Received">Inbound (they called)</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-graphite-500">Summary</span>
                <textarea name="summary" rows={2} className={inputClass} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-graphite-500">Outcome (optional)</span>
                <input type="text" name="outcome" className={inputClass} />
              </label>
            </SubForm>
          )}

          {addType === "meeting" && (
            <SubForm action={scheduleMeetingAction} submitLabel="Schedule" pendingLabel="Scheduling…" onSuccess={closeAndRefresh}>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-graphite-500">Subject</span>
                <input type="text" name="subject" required className={inputClass} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-graphite-500">Starts</span>
                  <input type="datetime-local" name="starts_on" required className={inputClass} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-graphite-500">Ends (optional)</span>
                  <input type="datetime-local" name="ends_on" className={inputClass} />
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-graphite-500">Description</span>
                <textarea name="description" rows={2} className={inputClass} />
              </label>
            </SubForm>
          )}

          {addType === "followup" && (
            <SubForm action={createFollowupAction} submitLabel="Create Follow-up" pendingLabel="Creating…" onSuccess={closeAndRefresh}>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-graphite-500">What needs to happen</span>
                <textarea name="description" rows={2} required className={inputClass} placeholder="e.g. Call customer to confirm pricing" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-graphite-500">Due date</span>
                  <input type="date" name="date" required className={inputClass} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-graphite-500">Priority</span>
                  <select name="priority" defaultValue="" className={inputClass}>
                    <option value="">Medium</option>
                    <option value="High">High</option>
                    <option value="Low">Low</option>
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-graphite-500">Assign to</span>
                {userOptions ? (
                  <select name="allocated_to" defaultValue={currentUserEmail} className={inputClass}>
                    {userOptions.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input type="text" name="allocated_to" defaultValue={currentUserEmail} className={inputClass} />
                )}
              </label>
            </SubForm>
          )}

          {addType === "note" && (
            <SubForm action={addNoteAction} submitLabel="Add Note" pendingLabel="Saving…" onSuccess={closeAndRefresh}>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-graphite-500">Note</span>
                <textarea name="note" rows={3} required className={inputClass} />
              </label>
            </SubForm>
          )}
        </div>
      )}

      {/* Open follow-ups */}
      {remainingOpenFollowups.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-2 text-sm font-semibold text-graphite-900">Other Open Follow-ups</h2>
          <ul className="space-y-2">
            {remainingOpenFollowups.map((f) => (
              <li key={f.todoName} className="flex items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <StatusPill label={BUCKET_DISPLAY[f.bucket].label} tone={BUCKET_DISPLAY[f.bucket].tone} />
                  <span className="text-graphite-900">{f.description}</span>
                  {f.dueDate && <span className="text-graphite-500">— {f.dueDate}</span>}
                </div>
                <button
                  type="button"
                  disabled={isPending && completingId === f.todoName}
                  onClick={() => handleComplete(f.todoName)}
                  className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-graphite-900 hover:bg-canvas disabled:opacity-60"
                >
                  {isPending && completingId === f.todoName ? "Completing…" : "Complete"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {nextFollowup && (
        <div className="-mt-3 flex justify-end">
          <button
            type="button"
            disabled={isPending && completingId === nextFollowup.todoName}
            onClick={() => handleComplete(nextFollowup.todoName)}
            className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-graphite-900 hover:bg-canvas disabled:opacity-60"
          >
            {isPending && completingId === nextFollowup.todoName ? "Completing…" : "Mark Next Follow-up Complete"}
          </button>
        </div>
      )}

      {/* Comment box */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-graphite-900">Comments</h2>
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-signal text-xs font-semibold text-white">
            {getInitials(currentUserFullName)}
          </span>
          <input
            ref={commentRef}
            type="text"
            placeholder="Type a reply / comment"
            onKeyDown={(e) => {
              if (e.key === "Enter") submitComment();
            }}
            className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
          />
          <button
            type="button"
            onClick={submitComment}
            className="rounded-md bg-signal px-3 py-2 text-sm font-medium text-white hover:bg-signal/90"
          >
            Post
          </button>
        </div>
        {commentError && <p className="mb-4 text-sm text-alert">{commentError}</p>}
      </div>

      {/* Unified timeline */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-graphite-900">Activity</h2>
        {grouped.length === 0 && <p className="text-sm text-graphite-500">No activity yet.</p>}
        {grouped.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-graphite-500">{group.label}</p>
            <ul>
              {group.entries.map((entry, idx) => (
                <li key={entry.id} className="relative flex gap-3 pb-5 pl-1 last:pb-0">
                  {idx !== group.entries.length - 1 && (
                    <span className="absolute left-[3.5px] top-3 h-full w-px bg-border" aria-hidden />
                  )}
                  <span
                    className={`relative mt-1.5 h-[7px] w-[7px] shrink-0 rounded-full ${
                      entry.kind === "system" ? "bg-graphite-500/50" : "bg-signal"
                    }`}
                  />
                  <p className="text-sm text-graphite-900">
                    {entry.kind !== "system" && (
                      <span className="mr-1.5 font-medium text-signal">{KIND_DISPLAY[entry.kind]}</span>
                    )}
                    {entry.kind === "system" ? entry.subject : entry.subject}
                    {entry.kind !== "system" && entry.description && entry.description !== entry.subject && (
                      <span className="block text-graphite-500">{entry.description}</span>
                    )}
                    <span className="text-graphite-500"> · {timeLabel(entry.timestamp)}</span>
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
