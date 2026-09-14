const styles = {
  success: "bg-success/10 text-success",
  alert: "bg-alert/10 text-alert",
  signal: "bg-signal/10 text-signal",
  neutral: "bg-graphite-500/10 text-graphite-500",
} as const;

export function StatusPill({ label, tone }: { label: string; tone: keyof typeof styles }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${styles[tone]}`}>
      {label}
    </span>
  );
}
