"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { TrendRange } from "@/lib/observabilityCenter/types";

const RANGES: { value: TrendRange; label: string }[] = [
  { value: "24h", label: "24 Hours" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
];

/** Range toggle for the error trend chart — writes `?range=` and lets the server
 * component re-render with the new window, same `searchParams`-driven pattern
 * `ListFilterBar.tsx` uses elsewhere in this app, just without a full form submit. */
export function ObservabilityRangeTabs({ active }: { active: TrendRange }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function select(range: TrendRange) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", range);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="inline-flex rounded-md border border-border bg-canvas p-0.5">
      {RANGES.map((r) => (
        <button
          key={r.value}
          type="button"
          onClick={() => select(r.value)}
          className={`rounded px-2.5 py-1 text-xs font-medium ${
            active === r.value ? "bg-surface text-graphite-900 shadow-sm" : "text-graphite-500 hover:text-graphite-900"
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
