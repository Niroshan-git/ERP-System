import type { LucideIcon } from "lucide-react";

/**
 * One Overview health-summary stat card (mission §4). Deliberately plain — a label, a
 * number, and one short sub-label communicating trend/urgency in text, not a decorated
 * KPI tile (mission §28 explicitly avoids "oversized KPI cards"). `tone` only shifts the
 * icon/number color using the same constrained token set `SeverityBadge` uses — no new
 * palette entries.
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
}: {
  label: string;
  value: string | number;
  subLabel?: string;
  icon: LucideIcon;
  tone?: keyof typeof TONE_CLASSES;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-graphite-500">{label}</p>
        <Icon size={16} className={TONE_CLASSES[tone]} />
      </div>
      <p className={`mt-2 text-2xl font-medium ${TONE_CLASSES[tone]}`}>{value}</p>
      {subLabel && <p className="mt-1 text-xs text-graphite-500">{subLabel}</p>}
    </div>
  );
}
