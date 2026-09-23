/**
 * Client-safe `CS-YYMMDD-XXXXXX` format check only — used by the Observability header's
 * trace search input (a Client Component) to validate what the user typed before it does
 * anything with it.
 *
 * Deliberately duplicated, not imported, from `lib/correlationId.ts`: that module is
 * `import "server-only"` (O-2's actual generator/validator, server-side trust boundary —
 * see `docs/observability-architecture.md`), and importing a `server-only` module from a
 * Client Component fails the build. This file carries zero trust properties of its own —
 * it never generates an ID and its result is never sent anywhere as if server-verified;
 * it only decides whether a pasted string is *shaped* like a real trace ID before the UI
 * bothers looking it up. Keep this regex identical to `lib/correlationId.ts`'s `FORMAT`
 * and `apps/smart_factory/smart_factory/api/observability.py`'s `CORRELATION_ID_RE`.
 */
const FORMAT = /^CS-\d{6}-[0-9A-F]{6}$/;

export function looksLikeCorrelationId(value: string): boolean {
  return FORMAT.test(value.trim().toUpperCase());
}
