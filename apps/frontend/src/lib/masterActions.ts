import "server-only";
import { ErpNextError } from "@/lib/erpnext";

/**
 * Shared error-message helper for the master-data actions.ts files. Mirrors the
 * tone customers/actions.ts established, parameterized by a human label
 * ("customer group", "territory", ...) instead of being hardcoded per doctype.
 */
export function humanizeError(e: unknown, label: string): string {
  if (e instanceof ErpNextError) {
    if (e.status === 409) return `A ${label} with that name already exists.`;
    if (e.status === 403) return `Not allowed to save this ${label}.`;
    return `ERPNext rejected this ${label} — check the required fields.`;
  }
  return "Something went wrong. Try again.";
}

/**
 * Pulls a flat set of fields off a submitted FormData: trimmed strings for
 * textKeys (empty string becomes undefined so ERPNext doesn't overwrite an
 * existing value with blank), and 0/1 for checkboxKeys.
 */
export function fieldsFromFormData(
  formData: FormData,
  textKeys: string[],
  checkboxKeys: string[] = [],
): Record<string, unknown> {
  const fields: Record<string, unknown> = {};

  for (const key of textKeys) {
    const raw = String(formData.get(key) ?? "").trim();
    fields[key] = raw || undefined;
  }

  for (const key of checkboxKeys) {
    fields[key] = formData.get(key) ? 1 : 0;
  }

  return fields;
}
