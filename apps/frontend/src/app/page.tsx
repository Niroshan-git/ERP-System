import Image from "next/image";

type Status = "good" | "warning" | "critical";

const statusStyles: Record<Status, { dot: string; text: string; bg: string; label: string }> = {
  good: { dot: "bg-tea", text: "text-tea", bg: "bg-tea/10", label: "Running" },
  warning: { dot: "bg-turmeric", text: "text-turmeric", bg: "bg-turmeric/10", label: "Attention" },
  critical: { dot: "bg-terracotta", text: "text-terracotta", bg: "bg-terracotta/10", label: "Down" },
};

function StatusPill({ status }: { status: Status }) {
  const s = statusStyles[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${s.bg} ${s.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function KpiTile({
  label,
  value,
  status,
  note,
}: {
  label: string;
  value: string;
  status: Status;
  note: string;
}) {
  const s = statusStyles[status];
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="font-[family-name:var(--font-ui)] text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {label}
      </p>
      <p className="mt-2 font-[family-name:var(--font-mono)] text-3xl font-medium tabular-nums text-ink">
        {value}
      </p>
      <p className={`mt-1 text-sm ${s.text}`}>{note}</p>
    </div>
  );
}

const jobCards = [
  { id: "JC-0142", workOrder: "WO-2201", machine: "CNC-04", status: "good" as Status, started: "07:10" },
  { id: "JC-0143", workOrder: "WO-2198", machine: "Press-02", status: "warning" as Status, started: "06:40" },
  { id: "JC-0144", workOrder: "WO-2205", machine: "Line-01", status: "critical" as Status, started: "14:22" },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-bg">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-6 py-5">
          <Image
            src="/brand/logo-mark.svg"
            alt="Ceylon Stack"
            width={28}
            height={28}
            className="dark:hidden"
          />
          <Image
            src="/brand/logo-mark-reverse.svg"
            alt="Ceylon Stack"
            width={28}
            height={28}
            className="hidden dark:block"
          />
          <span className="font-[family-name:var(--font-display)] text-lg font-semibold text-ink">
            Ceylon Stack
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <h1 className="max-w-2xl font-[family-name:var(--font-display)] text-4xl font-medium leading-tight text-ink">
          The smart factory platform for manufacturers who need more than a
          spreadsheet and less than an SAP rollout.
        </h1>

        <section className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiTile label="OEE" value="71.4%" status="warning" note="Below target" />
          <KpiTile label="Machines running" value="8 / 10" status="good" note="2 idle" />
          <KpiTile label="Downtime today" value="42 min" status="critical" note="Line-01 down since 14:22" />
        </section>

        <section className="mt-10">
          <h2 className="font-[family-name:var(--font-ui)] text-sm font-semibold uppercase tracking-wide text-ink-faint">
            Active job cards
          </h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-alt text-ink-soft">
                  <th className="px-4 py-2.5 font-[family-name:var(--font-ui)] font-semibold">Job Card</th>
                  <th className="px-4 py-2.5 font-[family-name:var(--font-ui)] font-semibold">Work Order</th>
                  <th className="px-4 py-2.5 font-[family-name:var(--font-ui)] font-semibold">Machine</th>
                  <th className="px-4 py-2.5 font-[family-name:var(--font-ui)] font-semibold">Status</th>
                  <th className="px-4 py-2.5 font-[family-name:var(--font-ui)] font-semibold">Started</th>
                </tr>
              </thead>
              <tbody>
                {jobCards.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 font-[family-name:var(--font-mono)] text-ink">{row.id}</td>
                    <td className="px-4 py-2.5 text-ink-soft">{row.workOrder}</td>
                    <td className="px-4 py-2.5 text-ink-soft">{row.machine}</td>
                    <td className="px-4 py-2.5">
                      <StatusPill status={row.status} />
                    </td>
                    <td className="px-4 py-2.5 font-[family-name:var(--font-mono)] text-ink-soft tabular-nums">
                      {row.started}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-5">
        <p className="mx-auto w-full max-w-5xl text-xs text-ink-faint">
          Ceylon Stack — built on ERPNext.
        </p>
      </footer>
    </div>
  );
}
