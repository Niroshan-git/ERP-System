import "server-only";
import { listDocs } from "@/lib/erpnext";

/**
 * Options for a Link field's <select>. Returns null (rather than throwing) when the
 * service account can't read the doctype, so a form can fall back to a plain text
 * input instead of crashing the whole page over an optional field.
 */
export async function fetchLinkOptions(doctype: string): Promise<string[] | null> {
  try {
    const rows = await listDocs<{ name: string }>(doctype, { fields: ["name"], limit: 500, orderBy: "name asc" });
    return rows.map((r) => r.name);
  } catch {
    return null;
  }
}
