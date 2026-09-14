"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { TimelineEntry } from "@/lib/timeline";

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function formatRelativeTime(dateStr: string | undefined | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return "";
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;
  return date.toISOString().slice(0, 10);
}

/**
 * Matches ERPNext Desk's own "Comments" input + "Activity" timeline on every document
 * form — see lib/timeline.ts for how `entries` is built to mirror Desk's real feed.
 * Desk's own "New Email" action button isn't offered here — no email/communication
 * feature exists in this app to open a composer for.
 */
export function ActivityTimeline({
  currentUserFullName,
  entries,
  postComment,
}: {
  currentUserFullName: string;
  entries: TimelineEntry[];
  postComment: (message: string) => Promise<{ error?: string }>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function submit() {
    const value = inputRef.current?.value.trim();
    if (!value) return;
    startTransition(async () => {
      const result = await postComment(value);
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    });
  }

  return (
    <div className="max-w-3xl">
      <h2 className="mb-2 text-sm font-semibold text-graphite-900">Comments</h2>
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-signal text-xs font-semibold text-white">
          {getInitials(currentUserFullName)}
        </span>
        <input
          ref={inputRef}
          type="text"
          placeholder="Type a reply / comment"
          disabled={isPending}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal disabled:opacity-60"
        />
        <button
          type="button"
          onClick={submit}
          disabled={isPending}
          className="rounded-md bg-signal px-3 py-2 text-sm font-medium text-white hover:bg-signal/90 disabled:opacity-60"
        >
          {isPending ? "Posting…" : "Post"}
        </button>
      </div>
      {error && <p className="mb-4 text-sm text-alert">{error}</p>}

      <h2 className="mb-3 text-sm font-semibold text-graphite-900">Activity</h2>
      <ul>
        {entries.map((entry, idx) => (
          <li key={entry.id} className="relative flex gap-3 pb-5 pl-1 last:pb-0">
            {idx !== entries.length - 1 && (
              <span className="absolute left-[3.5px] top-3 h-full w-px bg-border" aria-hidden />
            )}
            <span className="relative mt-1.5 h-[7px] w-[7px] shrink-0 rounded-full bg-graphite-500/50" />
            <p className="text-sm text-graphite-900">
              {entry.content} <span className="text-graphite-500">· {formatRelativeTime(entry.creation)}</span>
            </p>
          </li>
        ))}
        {entries.length === 0 && <p className="text-sm text-graphite-500">No activity yet.</p>}
      </ul>
    </div>
  );
}
