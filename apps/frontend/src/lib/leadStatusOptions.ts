/**
 * Manual Lead status choices offered by the status-change control, shared between the
 * server action (`crm/leads/actions.ts`'s `updateLeadStatusAction`, which re-validates
 * against this same list server-side) and the client-side status control component. Kept
 * in its own plain module rather than inside `actions.ts` because a `"use server"` file
 * may only export async functions — see `crm/leads/actions.ts`'s doc comment on
 * `updateLeadStatusAction` for why `Opportunity`/`Quotation`/`Converted` are deliberately
 * excluded from this list.
 */
export const MANUAL_LEAD_STATUS_OPTIONS = ["Lead", "Open", "Replied", "Interested", "Lost Quotation", "Do Not Contact"];
