/**
 * Shared HTML-escaping helper for server actions that interpolate user-supplied text into a
 * Text Editor field's HTML content (Comment, CRM Call/Meeting/Follow-up/Note, …). Plain,
 * framework-agnostic module (not "use server") so it can be imported from both a "use server"
 * actions file and anywhere else — a "use server" file may only export async functions, so this
 * couldn't live inside one of those directly.
 */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
