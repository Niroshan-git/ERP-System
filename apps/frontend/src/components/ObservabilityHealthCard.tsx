import Link from "next/link";
import type { LucideIcon } from "lucide-react";

/**
 * One Overview health-summary stat card (mission §4). Deliberately plain — a label, a
 * number, and one short sub-label communicating trend/urgency in text, not a decorated
 * KPI tile (mission §28 explicitly avoids "oversized KPI cards"). `tone` only shifts the
 * icon/number color using the same constrained token set `SeverityBadge` uses — no new
 * palette entries.
 *
 * `href` (added O-8) makes the whole card a link to a real screen — used once User
 * Activity actually exists to link the "Activity" card there, continuing the "one
 * investigation system" goal (mission §3). Optional and backward compatible: cards with
 * no real destination (Failed Integrations, still O-10) simply omit it and render as
 * plain, non-interactive cards, same as before.
 */
const TONE_CLASSES = {
  neutral: "text-graphite-900",
  alert: "text-alert",
  signal: "text-signal",
} as const;

export function ObservabilityHealthCard({
  label,
  value,
  subLabel,
  icon: Icon,
  tone = "neutral",
  href,
}: {
  label: string;
  value: string | number;
  subLabel?: string;
  icon: LucideIcon;
  tone?: keyof typeof TONE_CLASSES;
  href?: string;
}) {
  const content = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-graphite-500">{label}</p>
        <Icon size={16} className={TONE_CLASSES[tone]} />
      </div>
      <p className={`mt-2 text-2xl font-medium ${TONE_CLASSES[tone]}`}>{value}</p>
      {subLabel && <p className="mt-1 text-xs text-graphite-500">{subLabel}</p>}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="block rounded-xl border border-border bg-surface p-4 hover:bg-canvas">
        {content}
      </Link>
    );
  }

  return <div className="rounded-xl border border-border bg-surface p-4">{content}</div>;
}
