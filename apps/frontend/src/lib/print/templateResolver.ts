/**
 * Template resolution (LP-1 §6 decision, carried forward unchanged in LP-2). V1 ships exactly one
 * template — "Ceylon Stack Standard" — and this function always returns it. The signature stays
 * future-shaped (`doctype`/`company` accepted now, `company` unused) specifically so a future LP-9
 * package can implement the full System → Company → Document Type → Explicit resolution chain the
 * mission sketches conceptually without changing any call site's signature.
 *
 * No template registry/config exists yet because none is needed — this is not a placeholder for
 * "will wire it up later," it's the deliberately minimal V1 scope LP-1 already decided on.
 */

export type ResolvedTemplate = {
  id: string;
  label: string;
};

const STANDARD_TEMPLATE: ResolvedTemplate = {
  id: "ceylon-standard",
  label: "Ceylon Stack Standard",
};

export function resolveTemplate(_doctype: string, _company?: string): ResolvedTemplate {
  return STANDARD_TEMPLATE;
}
