export function AccessDeniedNotice({ what }: { what: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <p className="text-sm font-medium text-graphite-900">Not authorized yet</p>
      <p className="mt-1 text-sm text-graphite-500">
        The service account this app uses isn&apos;t authorized to access {what} in ERPNext yet. Ask an ERPNext
        admin to grant the &quot;Frontend Integration&quot; user an accounting role (e.g. Accounts User) via Desk →
        User → Role Profile.
      </p>
    </div>
  );
}
