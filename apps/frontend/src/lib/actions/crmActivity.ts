"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createDoc, getDoc, updateDoc, ErpNextError } from "@/lib/erpnext";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { escapeHtml } from "@/lib/html";
import type { CrmDoctype, CrmNoteRow } from "@/lib/crmActivity";

export type ActivityFormState = { error?: string } | undefined;

function humanizeActivityError(e: unknown, label: string): string {
  if (e instanceof ErpNextError) {
    if (e.status === 403) return `Not allowed to log this ${label}.`;
    return `ERPNext rejected this ${label} — check the required fields.`;
  }
  return "Something went wrong. Try again.";
}

async function requireSession() {
  const cookieStore = await cookies();
  return verifySession(cookieStore.get(SESSION_COOKIE)?.value);
}

/**
 * Converts a `<input type="datetime-local">` value ("YYYY-MM-DDTHH:MM") into the
 * "YYYY-MM-DD HH:MM:SS" shape ERPNext's Datetime fields expect over REST — same conversion
 * `manufacturing/work-orders/actions.ts`'s own `toErpDatetime()` already established (found by
 * this package's QA pass, which caught `createMeetingAction` sending seconds-less values). Kept
 * as a local copy rather than importing that one: Manufacturing is frozen at its current V1
 * boundary per `CLAUDE.md`'s Current Mission lock, so this package doesn't touch it to extract a
 * shared helper.
 */
function toErpDatetime(value: string): string {
  return `${value.replace("T", " ")}:00`;
}

/**
 * Log Call → `Communication` (`communication_medium: "Phone"`), the same doctype ERPNext's
 * own Desk "Log a Call" affordance writes to. `status: "Linked"` (a real value on
 * Communication's own enum, alongside Open/Replied/Closed) is used for a logged call rather
 * than "Open" — this is a completed record of something that already happened, not an open
 * thread awaiting a reply. `sender_full_name`/`user` carry the real logged-in person (unlike
 * `owner`, always the shared service account per the app's documented auth model) — real
 * dedicated fields on this doctype, not a text-embedding workaround.
 */
export async function createCallAction(
  doctype: CrmDoctype,
  name: string,
  revalidatePathValue: string,
  _prevState: ActivityFormState,
  formData: FormData,
): Promise<ActivityFormState> {
  const subject = String(formData.get("subject") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const outcome = String(formData.get("outcome") ?? "").trim();
  const sentOrReceived = String(formData.get("sent_or_received") ?? "Sent").trim() || "Sent";

  if (!subject) return { error: "Enter a subject for the call." };

  const session = await requireSession();
  if (!session) return { error: "Your session expired — reload the page." };

  const contentParts = [`<p>${escapeHtml(summary)}</p>`];
  if (outcome) contentParts.push(`<p><strong>Outcome:</strong> ${escapeHtml(outcome)}</p>`);

  try {
    await createDoc("Communication", {
      subject,
      content: contentParts.join(""),
      communication_medium: "Phone",
      communication_type: "Communication",
      status: "Linked",
      sent_or_received: sentOrReceived,
      communication_date: new Date().toISOString().slice(0, 19).replace("T", " "),
      reference_doctype: doctype,
      reference_name: name,
      user: session.email,
      sender: session.email,
      sender_full_name: session.fullName,
    });
  } catch (e) {
    return { error: humanizeActivityError(e, "call") };
  }

  revalidatePath(revalidatePathValue);
  return {};
}

/**
 * Schedule Meeting → `Event` (`event_category: "Meeting"`). No dedicated "logged by" field
 * exists on Event the way Communication has `sender_full_name`, so the real human's name is
 * embedded directly in `description` — the same fallback this app already uses for Comment
 * (`postCommentAction`'s doc comment) whenever a doctype's own `owner` would otherwise be the
 * only (and misleading) attribution.
 */
export async function createMeetingAction(
  doctype: CrmDoctype,
  name: string,
  revalidatePathValue: string,
  _prevState: ActivityFormState,
  formData: FormData,
): Promise<ActivityFormState> {
  const subject = String(formData.get("subject") ?? "").trim();
  const startsOn = String(formData.get("starts_on") ?? "").trim();
  const endsOn = String(formData.get("ends_on") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!subject) return { error: "Enter a subject for the meeting." };
  if (!startsOn) return { error: "Set a start date/time for the meeting." };

  const session = await requireSession();
  if (!session) return { error: "Your session expired — reload the page." };

  try {
    await createDoc("Event", {
      subject,
      event_category: "Meeting",
      event_type: "Private",
      starts_on: toErpDatetime(startsOn),
      ends_on: endsOn ? toErpDatetime(endsOn) : undefined,
      description: `<p>Scheduled by ${escapeHtml(session.fullName)}</p>${description ? `<p>${escapeHtml(description)}</p>` : ""}`,
      reference_doctype: doctype,
      reference_docname: name,
    });
  } catch (e) {
    return { error: humanizeActivityError(e, "meeting") };
  }

  revalidatePath(revalidatePathValue);
  return {};
}

/**
 * Create Follow-up → `ToDo`, the "Next Follow-up"/"Overdue" source of truth
 * (`lib/crmActivity.ts`'s `getNextFollowup`/`followupBucket`) — a due date is required here
 * even though ERPNext's own schema leaves `date` optional, because an undated follow-up can't
 * participate in the overdue/due-today/upcoming derivation this package's own core capability
 * depends on (mission brief §14). `assigned_by` is set to the real logged-in person for the
 * same reason `sender_full_name` is set on Call — a genuine field, not a workaround.
 */
export async function createFollowupAction(
  doctype: CrmDoctype,
  name: string,
  revalidatePathValue: string,
  _prevState: ActivityFormState,
  formData: FormData,
): Promise<ActivityFormState> {
  const description = String(formData.get("description") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const allocatedTo = String(formData.get("allocated_to") ?? "").trim();
  const priority = String(formData.get("priority") ?? "").trim();

  if (!description) return { error: "Describe what needs to be followed up." };
  if (!date) return { error: "Set a due date for the follow-up." };

  const session = await requireSession();
  if (!session) return { error: "Your session expired — reload the page." };

  try {
    await createDoc("ToDo", {
      description: `<p>${escapeHtml(description)}</p>`,
      date,
      status: "Open",
      priority: priority || undefined,
      allocated_to: allocatedTo || undefined,
      assigned_by: session.email,
      reference_type: doctype,
      reference_name: name,
    });
  } catch (e) {
    return { error: humanizeActivityError(e, "follow-up") };
  }

  revalidatePath(revalidatePathValue);
  return {};
}

/**
 * ToDo Open → Closed. History stays visible (`getCrmActivityTimeline` doesn't filter by
 * status), it just stops counting as open/overdue work (`followupBucket`). `revalidatePathValue`
 * comes first so callers can `.bind(null, revalidatePathValue)` once per page and pass the
 * per-row `todoName` at click time, matching `postCommentAction`'s own bind-then-call shape.
 */
export async function completeFollowupAction(
  revalidatePathValue: string,
  todoName: string,
): Promise<{ error?: string }> {
  try {
    await updateDoc("ToDo", todoName, { status: "Closed" }, "complete follow-up");
  } catch (e) {
    return { error: humanizeActivityError(e, "follow-up") };
  }
  revalidatePath(revalidatePathValue);
  return {};
}

/**
 * Event Open → Completed (native `Event.status` enum, `Open/Completed/Closed/Cancelled` —
 * `Completed` is the real value used here, not a Ceylon Stack invention). Added after this
 * package's own QA pass found a genuine dead end: without this, a Meeting whose `starts_on` has
 * passed sits permanently in the Overdue bucket in `/crm/activities` with no in-app resolution.
 * Same bind-then-call shape as `completeFollowupAction`.
 */
export async function completeMeetingAction(
  revalidatePathValue: string,
  eventName: string,
): Promise<{ error?: string }> {
  try {
    await updateDoc("Event", eventName, { status: "Completed" }, "complete meeting");
  } catch (e) {
    return { error: humanizeActivityError(e, "meeting") };
  }
  revalidatePath(revalidatePathValue);
  return {};
}

type NotesDoc = { notes?: CrmNoteRow[] };

/**
 * Add Note → appends to the real `CRM Note` child table already present on Lead/Opportunity
 * (the `notes` field) — a genuine, CRM-specific native mechanism, not a new doctype. Child
 * rows have no standalone REST endpoint of their own (no `reference_type`/`reference_name`,
 * §8), so this reads the parent's current `notes` array and writes the full array back —
 * the same read-modify-write convention this app already uses for every other child table
 * (e.g. `OpportunityItemsEditor`'s `items` save), not a new pattern.
 */
export async function createNoteAction(
  doctype: CrmDoctype,
  name: string,
  revalidatePathValue: string,
  _prevState: ActivityFormState,
  formData: FormData,
): Promise<ActivityFormState> {
  const note = String(formData.get("note") ?? "").trim();
  if (!note) return { error: "Write a note before saving." };

  const session = await requireSession();
  if (!session) return { error: "Your session expired — reload the page." };

  try {
    const current = await getDoc<NotesDoc>(doctype, name);
    const nextNotes = [
      ...(current.notes ?? []),
      {
        note: `<p>${escapeHtml(note)}</p>`,
        added_by: session.email,
        added_on: new Date().toISOString().slice(0, 19).replace("T", " "),
      },
    ];
    await updateDoc(doctype, name, { notes: nextNotes }, "add CRM note");
  } catch (e) {
    return { error: humanizeActivityError(e, "note") };
  }

  revalidatePath(revalidatePathValue);
  return {};
}
