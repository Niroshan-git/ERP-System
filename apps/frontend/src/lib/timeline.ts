import "server-only";
import { getDocInfo } from "@/lib/erpnext";

export type TimelineEntry = { id: string; creation: string; content: string };

/**
 * Replicates ERPNext Desk's own Activity timeline (`frappe/public/js/frappe/form/
 * footer/{form_timeline,version_timeline_content_builder}.js`, read on the live server)
 * server-side instead of guessing at a format: "created this"/"last edited this" from
 * the doc's own audit fields, each Comment, each system "info" comment (bare status
 * labels ERPNext posts on some transitions), and each Version's parsed diff — submitted/
 * cancelled from a `docstatus` change, else "changed the value of X from Y to Z"
 * (capped at 3 fields per version, matching Desk's own `parts.length < 3` cutoff).
 * Sorted newest-first, matching Desk's `new Date(b.creation) - new Date(a.creation)`.
 *
 * Deliberately not replicated: communications/emails, shares, workflow, likes,
 * assignments, attachments, milestones, page views — this app has none of those
 * features, so there's nothing in `docinfo` for them to ever contain.
 *
 * Known limitation (see the "Auth model" note in README.md): every version/info-log
 * entry's actor is whoever the *ERPNext* session was — always the shared service
 * account for anything done through this app, never the actual human. Comments are the
 * one exception, because `postCommentAction` embeds the real name directly in the
 * comment's own content (see lib/erpnext.ts's `addComment` doc comment).
 */

const FIELD_LABEL_OVERRIDES: Record<string, string> = {
  per_delivered: "% Delivered",
  per_billed: "% Amount Billed",
  grand_total: "Grand Total",
  base_grand_total: "Grand Total",
  transaction_date: "Date",
  delivery_date: "Delivery Date",
  valid_till: "Valid Till",
  po_no: "PO No",
  po_date: "PO Date",
  tc_name: "Terms and Conditions Template",
};

function humanizeField(fieldname: string): string {
  if (FIELD_LABEL_OVERRIDES[fieldname]) return FIELD_LABEL_OVERRIDES[fieldname];
  return fieldname
    .split("_")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function truncateValue(v: unknown): string {
  if (v === null || v === undefined || v === "") return '""';
  const s = String(v);
  return s.length > 40 ? `${s.slice(0, 40)}…` : s;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function resolveName(userInfo: Record<string, { fullname: string }>, id: string): string {
  return userInfo[id]?.fullname || id;
}

type VersionData = {
  changed?: [string, unknown, unknown][];
};

export async function buildTimeline(
  doctype: string,
  name: string,
  doc: { creation: string; owner: string; modified: string; modified_by: string },
): Promise<TimelineEntry[]> {
  const { comments, versions, infoLogs, userInfo } = await getDocInfo(doctype, name);
  const entries: TimelineEntry[] = [];

  // Singles (e.g. Selling Settings) can have a null `creation` — there's no real "created"
  // moment distinct from the record just existing, so that entry is skipped rather than
  // rendered with a broken date.
  if (doc.creation) {
    entries.push({
      id: "created",
      creation: doc.creation,
      content: `${resolveName(userInfo, doc.owner)} created this`,
    });
  }
  if (doc.modified) {
    entries.push({
      id: "modified",
      creation: doc.modified,
      content: `${resolveName(userInfo, doc.modified_by)} last edited this`,
    });
  }

  for (const c of comments) {
    entries.push({ id: `comment-${c.name}`, creation: c.creation, content: stripHtml(c.content) });
  }

  for (const log of infoLogs) {
    entries.push({
      id: `info-${log.name}`,
      creation: log.creation,
      content: `${resolveName(userInfo, log.owner)} ${log.content}`,
    });
  }

  for (const v of versions) {
    let data: VersionData;
    try {
      data = JSON.parse(v.data) as VersionData;
    } catch {
      continue;
    }
    if (!data.changed || data.changed.length === 0) continue;

    const actor = resolveName(userInfo, v.owner);
    const docstatusChange = data.changed.find((c) => c[0] === "docstatus");
    if (docstatusChange) {
      if (docstatusChange[2] === 1) {
        entries.push({ id: `ver-${v.name}-submit`, creation: v.creation, content: `${actor} submitted this document` });
      } else if (docstatusChange[2] === 2) {
        entries.push({ id: `ver-${v.name}-cancel`, creation: v.creation, content: `${actor} cancelled this document` });
      }
    }

    const fieldChanges = data.changed.filter((c) => c[0] !== "docstatus").slice(0, 3);
    if (fieldChanges.length > 0) {
      const parts = fieldChanges.map(
        (c) => `${humanizeField(c[0])} from ${truncateValue(c[1])} to ${truncateValue(c[2])}`,
      );
      entries.push({
        id: `ver-${v.name}-changed`,
        creation: v.creation,
        content: `${actor} changed the value of ${parts.join(", ")}`,
      });
    }
  }

  entries.sort((a, b) => new Date(b.creation).getTime() - new Date(a.creation).getTime());
  return entries;
}
