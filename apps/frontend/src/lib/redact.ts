import "server-only";

/**
 * Defense-in-depth text scrubber for free-text error/message strings that might echo back
 * something sensitive (e.g. an ERPNext error body reflecting a request header). The primary
 * defense against leaking secrets is architectural, not this function: everything sent to
 * smart_factory's observability endpoint (see lib/observability.ts) is built from an explicit,
 * fixed field allowlist — actor email/name, correlation ID, operation, doctype/name — never a
 * raw request/response dump. This only cleans the free-text `message`/`detail` strings within
 * that allowlist.
 */
const PATTERNS: RegExp[] = [
  // Matches "Authorization:" plus up to two whitespace-separated tokens (covers both
  // "Bearer <token>" and "token <key>:<secret>" shapes). A plain `\S+` here previously only
  // consumed the scheme word ("Bearer"/"token") and left the actual credential — which follows
  // a space — untouched; live-tested 2026-09-23, confirmed as a real leak, fixed by capturing
  // both tokens in one match instead of relying on the later Bearer/token patterns below to
  // catch what this one left behind (they can't: this pattern runs first and already consumed
  // the scheme word they match on).
  /Authorization:\s*\S+(?:\s+\S+)?/gi,
  /\btoken\s+[A-Za-z0-9:_-]{8,}/gi,
  /\bBearer\s+[A-Za-z0-9._-]{8,}/gi,
  /\bceylon_session=[^;\s]+/gi,
  // access_token/refresh_token in "bare word + value" shape (e.g. an OAuth response body
  // echoed verbatim into a diagnostic string: "access_token eyJhbGc..."), same shape as the
  // token/Bearer patterns above — a key=value form alone (below) would miss this, since there's
  // no `:`/`=` separator here. O-10B §20 explicitly names access_token/refresh_token; live-
  // verified 2026-09-24 that the pre-existing password|secret|api-key alternation did not cover
  // either word in any shape.
  /\b(?:access|refresh)[-_]?token\s+[A-Za-z0-9._-]{8,}/gi,
  /\b(password|secret|api[-_]?key|api[-_]?secret|access[-_]?token|refresh[-_]?token)["']?\s*[:=]\s*["']?\S+/gi,
];

export function redactString(value: string): string {
  return PATTERNS.reduce((acc, pattern) => acc.replace(pattern, (match) => `${match.split(/[\s:=]/)[0]} [REDACTED]`), value);
}
