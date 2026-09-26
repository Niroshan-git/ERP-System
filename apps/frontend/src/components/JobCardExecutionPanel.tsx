"use client";

import { useActionState, useMemo, useState } from "react";

export type JobCardExecState = { error?: string } | undefined;

/** "YYYY-MM-DDTHH:MM" (datetime-local) -> "YYYY-MM-DD HH:MM:SS" (ERPNext Datetime), local time —
 * same conversion shape as `manufacturing/work-orders/actions.ts`'s `toErpDatetime`, computed
 * client-side here (not server `new Date()`) so it reflects the operator's own local clock, the
 * same way ERPNext Desk's own `frappe.datetime.now_datetime()` captures browser-local time at
 * the moment a Start/Complete button is actually clicked, not server time. */
function nowAsErpDatetime(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** Same "T" -> " " conversion as `nowAsErpDatetime()`'s server counterpart, but source-agnostic
 * about whether the `datetime-local` input included seconds (`step={1}` asks for them, but not
 * every browser/input state honors that) — appends ":00" only when they're actually missing,
 * rather than assuming a fixed 16-char shape. Real bug this fixes, live-caught during MFG-JC-
 * EXEC-1's own E2E-1 verification pass: Start and Complete happening inside the same clock
 * minute made a seconds-less End Time read as *before* the Start time it was compared against
 * (ERPNext's own "From time must be less than to time" check), since Start's time is captured
 * with real seconds precision but a stripped-seconds End Time silently defaults to :00. */
function toErpDatetimeLocal(value: string): string {
  const withT = value.includes("T") ? value : value.replace(" ", "T");
  const [datePart, timePart] = withT.split("T");
  const hasSeconds = (timePart ?? "").split(":").length === 3;
  return `${datePart} ${hasSeconds ? timePart : `${timePart}:00`}`;
}

/**
 * `MFG-JC-EXEC-1` — Start/Complete panel for a Draft Job Card, the canonical minimum flow
 * (OPEN -> START -> IN PROGRESS -> COMPLETE) the mission calls for. Which form renders is decided
 * by the page (`jobCardExecutionState()`), not here — this component only renders the one form
 * it's told to.
 */
export function JobCardExecutionPanel({
  mode,
  remainingQty,
  activeEmployees,
  startAction,
  completeAction,
}: {
  mode: "can-start" | "can-complete";
  remainingQty: number;
  activeEmployees: { name: string; employee_name?: string }[];
  startAction: (state: JobCardExecState, formData: FormData) => Promise<JobCardExecState>;
  completeAction: (state: JobCardExecState, formData: FormData) => Promise<JobCardExecState>;
}) {
  if (mode === "can-start") {
    return <StartForm activeEmployees={activeEmployees} startAction={startAction} />;
  }
  return <CompleteForm remainingQty={remainingQty} completeAction={completeAction} />;
}

function StartForm({
  activeEmployees,
  startAction,
}: {
  activeEmployees: { name: string; employee_name?: string }[];
  startAction: (state: JobCardExecState, formData: FormData) => Promise<JobCardExecState>;
}) {
  const [state, formAction, isPending] = useActionState<JobCardExecState, FormData>(startAction, undefined);
  const [selected, setSelected] = useState<string[]>(activeEmployees.length === 1 ? [activeEmployees[0].name] : []);

  function toggle(name: string) {
    setSelected((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h2 className="mb-2 text-sm font-semibold text-graphite-900">Start Job</h2>
      {activeEmployees.length === 0 ? (
        <p className="text-sm text-alert">No Active Employees found — an Employee is required to start this Job Card.</p>
      ) : (
        <form
          action={(formData) => {
            formData.set("start_time", nowAsErpDatetime());
            return formAction(formData);
          }}
          className="space-y-3"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-graphite-500">Employees</label>
            <div className="space-y-1">
              {activeEmployees.map((emp) => (
                <label key={emp.name} className="flex items-center gap-2 text-sm text-graphite-900">
                  <input
                    type="checkbox"
                    name="employees"
                    value={emp.name}
                    checked={selected.includes(emp.name)}
                    onChange={() => toggle(emp.name)}
                    className="rounded border-border"
                  />
                  {emp.employee_name || emp.name} <span className="font-mono text-graphite-500">({emp.name})</span>
                </label>
              ))}
            </div>
          </div>
          {state?.error && <p className="text-sm text-alert">{state.error}</p>}
          <button
            type="submit"
            disabled={isPending || selected.length === 0}
            className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90 disabled:opacity-60"
          >
            {isPending ? "Starting…" : "Start Job"}
          </button>
        </form>
      )}
    </div>
  );
}

function CompleteForm({
  remainingQty,
  completeAction,
}: {
  remainingQty: number;
  completeAction: (state: JobCardExecState, formData: FormData) => Promise<JobCardExecState>;
}) {
  const [state, formAction, isPending] = useActionState<JobCardExecState, FormData>(completeAction, undefined);
  const [qty, setQty] = useState(remainingQty);
  const [pendingQty, setPendingQty] = useState(0);
  const [processLossQty, setProcessLossQty] = useState(0);
  const defaultEndTime = useMemo(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }, []);
  const [endTime, setEndTime] = useState(defaultEndTime);

  const accounted = qty + pendingQty + processLossQty;
  const overAllocated = accounted - remainingQty > 1e-6;

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h2 className="mb-2 text-sm font-semibold text-graphite-900">Complete Job</h2>
      <p className="mb-3 text-xs text-graphite-500">
        Remaining to manufacture: <span className="font-mono text-graphite-900">{remainingQty}</span>
      </p>
      <form
        action={(formData) => {
          formData.set("end_time", toErpDatetimeLocal(endTime));
          return formAction(formData);
        }}
        className="space-y-3"
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-graphite-500">Completed Qty</label>
            <input
              type="number"
              name="qty"
              min={0}
              step="any"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm font-mono focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-graphite-500">Pending Qty</label>
            <input
              type="number"
              name="pending_qty"
              min={0}
              step="any"
              value={pendingQty}
              onChange={(e) => setPendingQty(Number(e.target.value))}
              className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm font-mono focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-graphite-500">Process Loss Qty</label>
            <input
              type="number"
              name="process_loss_qty"
              min={0}
              step="any"
              value={processLossQty}
              onChange={(e) => setProcessLossQty(Number(e.target.value))}
              className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm font-mono focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-graphite-500">End Time</label>
            <input
              type="datetime-local"
              step={1}
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
            />
          </div>
        </div>
        {overAllocated && (
          <p className="text-sm text-alert">
            Completed + Pending + Process Loss ({accounted}) exceeds the remaining {remainingQty}.
          </p>
        )}
        {state?.error && <p className="text-sm text-alert">{state.error}</p>}
        <button
          type="submit"
          disabled={isPending || overAllocated || qty <= 0}
          className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90 disabled:opacity-60"
        >
          {isPending ? "Completing…" : "Complete Job"}
        </button>
      </form>
    </div>
  );
}
