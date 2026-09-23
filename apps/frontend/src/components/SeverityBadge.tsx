import { AlertCircle, AlertTriangle, Info, Siren } from "lucide-react";
import type { Severity } from "@/lib/observabilityCenter/types";

/**
 * Renders a Severity with its text label always visible (never color-only — see this
 * mission's §29) plus a supporting icon. Ceylon Stack's design tokens
 * (`globals.css`) only define one warm hue (`--alert`) alongside `--signal`/`--success`/
 * neutral graphite — no separate red exists for CRITICAL. Rather than hand-picking a new
 * color outside that set, severity above INFO is differentiated by *intensity* of the
 * same `alert` hue (WARNING: faint tint → ERROR: tinted + border → CRITICAL: solid fill)
 * plus a distinct icon per level, so the four levels stay visually ordered without a
 * palette addition `docs/brand.md` hasn't approved.
 */
const CONFIG: Record<Severity, { label: string; icon: typeof Info; className: string }> = {
  INFO: {
    label: "INFO",
    icon: Info,
    className: "bg-graphite-500/10 text-graphite-500",
  },
  WARNING: {
    label: "WARNING",
    icon: AlertTriangle,
    className: "bg-alert/10 text-alert",
  },
  ERROR: {
    label: "ERROR",
    icon: AlertCircle,
    className: "border border-alert/40 bg-alert/15 text-alert",
  },
  CRITICAL: {
    label: "CRITICAL",
    icon: Siren,
    className: "bg-alert text-white",
  },
};

export function SeverityBadge({ severity, className = "" }: { severity: Severity; className?: string }) {
  const { label, icon: Icon, className: toneClassName } = CONFIG[severity];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide ${toneClassName} ${className}`}
    >
      <Icon size={12} className="shrink-0" />
      {label}
    </span>
  );
}
