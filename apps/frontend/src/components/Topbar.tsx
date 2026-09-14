"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function Topbar({ fullName }: { fullName: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function logout() {
    startTransition(async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-3">
      <div />
      <div className="flex items-center gap-4">
        {/* Bell icon reserved for Notification Log — needs per-user ERPNext sessions
            (Phase 2) to show the right person's notifications under the service-account
            model this MVP uses, so it's left as a placeholder rather than shipped wrong. */}
        <button
          type="button"
          disabled
          title="Notifications — coming with per-user login (Phase 2)"
          className="rounded p-1.5 text-graphite-500 opacity-40"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>

        <span className="text-sm text-graphite-500">{fullName}</span>
        <button
          type="button"
          onClick={logout}
          disabled={isPending}
          className="text-sm font-medium text-signal hover:underline disabled:opacity-50"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
