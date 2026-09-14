"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { addComment, ErpNextError } from "@/lib/erpnext";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

export type CommentResult = { error?: string };

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Posts a comment on any doctype's Comments tab, shared across Quotation/Sales
 * Order/Sales Invoice/Selling Settings rather than duplicated per doctype. Re-reads the
 * session from the cookie itself (not trusted from the client) so the attributed name
 * can't be spoofed by a tampered form field — the whole point of embedding a real name
 * here (see lib/erpnext.ts's addComment doc comment) is defeated if it isn't the actual
 * logged-in person.
 */
export async function postCommentAction(
  doctype: string,
  name: string,
  revalidatePathValue: string,
  message: string,
): Promise<CommentResult> {
  const trimmed = message.trim();
  if (!trimmed) return { error: "Comment can't be empty." };

  const cookieStore = await cookies();
  const session = await verifySession(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session) return { error: "Your session expired — reload the page." };

  const content = `<p><strong>${escapeHtml(session.fullName)}:</strong> ${escapeHtml(trimmed)}</p>`;

  try {
    await addComment(doctype, name, content, session.email, session.fullName);
  } catch (e) {
    if (e instanceof ErpNextError) return { error: e.erpnextMessage ?? "Could not post the comment." };
    return { error: "Something went wrong. Try again." };
  }

  revalidatePath(revalidatePathValue);
  return {};
}
