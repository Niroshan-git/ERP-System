"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/(app)/crm/leads/actions";

const LEAD_TYPES = ["Client", "Channel Partner", "Consultant"];
const REQUEST_TYPES = ["Product Enquiry", "Request for Information", "Suggestions", "Other"];
const EMPLOYEE_BRACKETS = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];
const QUALIFICATION_STATUSES = ["Unqualified", "In Process", "Qualified"];

export type LeadFormInitial = {
  salutation?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  job_title?: string;
  gender?: string;
  type?: string;
  request_type?: string;
  email_id?: string;
  website?: string;
  mobile_no?: string;
  whatsapp_no?: string;
  phone?: string;
  phone_ext?: string;
  company_name?: string;
  no_of_employees?: string;
  annual_revenue?: number;
  industry?: string;
  market_segment?: string;
  city?: string;
  state?: string;
  country?: string;
  territory?: string;
  lead_owner?: string;
  company?: string;
  qualification_status?: string;
  disabled?: 0 | 1;
  unsubscribed?: 0 | 1;
};

export type LeadFormOptions = {
  salutations: string[] | null;
  genders: string[] | null;
  industries: string[] | null;
  marketSegments: string[] | null;
  countries: string[] | null;
  territories: string[] | null;
  owners: string[] | null;
  companies: string[] | null;
};

/**
 * Create/Edit form for Lead — mirrors `CustomerForm.tsx`'s shape (controlled by a bound
 * server action, `initial` for edit) but grouped into headed sections since Lead carries
 * meaningfully more fields than Customer: Identity, Contact, Classification, Organization
 * & Geography, Ownership & Qualification. Used standalone on `/crm/leads/new` and reused
 * as-is for the "Overview" tab of the Lead detail page (`crm/leads/[name]/page.tsx`) —
 * a deliberate simplification versus splitting into 3 separate DocTabs tabs sharing one
 * `form=` id (the pattern `AddressContactFields`/`TermsFields` use for Sales Order): Lead
 * has no line items or docstatus-driven multi-tab need, so one form with headed <fieldset>
 * sections covers "group them" from the CRM-1 brief without duplicating field markup
 * across two places for a single always-editable (draftless) document.
 */
export function LeadForm({
  action,
  options,
  initial,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  options: LeadFormOptions;
  initial?: LeadFormInitial;
}) {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(action, undefined);
  const isEdit = Boolean(initial);

  return (
    <form action={formAction} className="max-w-3xl space-y-6">
      <fieldset className="space-y-4">
        <legend className="mb-1 text-sm font-semibold text-graphite-900">Identity</legend>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <LinkOrTextField id="salutation" label="Salutation" options={options.salutations} defaultValue={initial?.salutation} />
          <TextField id="first_name" label="First name" defaultValue={initial?.first_name} />
          <TextField id="middle_name" label="Middle name" defaultValue={initial?.middle_name} />
          <TextField id="last_name" label="Last name" defaultValue={initial?.last_name} />
          <TextField id="job_title" label="Job title" defaultValue={initial?.job_title} />
          <LinkOrTextField id="gender" label="Gender" options={options.genders} defaultValue={initial?.gender} />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-1 text-sm font-semibold text-graphite-900">Contact</legend>
        <div className="grid grid-cols-2 gap-4">
          <TextField id="email_id" label="Email" type="email" defaultValue={initial?.email_id} />
          <TextField id="website" label="Website" defaultValue={initial?.website} />
          <TextField id="mobile_no" label="Mobile" defaultValue={initial?.mobile_no} />
          <TextField id="whatsapp_no" label="WhatsApp" defaultValue={initial?.whatsapp_no} />
          <TextField id="phone" label="Phone" defaultValue={initial?.phone} />
          <TextField id="phone_ext" label="Phone ext." defaultValue={initial?.phone_ext} />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-1 text-sm font-semibold text-graphite-900">Classification</legend>
        <div className="grid grid-cols-2 gap-4">
          <SelectField id="type" label="Lead type" options={LEAD_TYPES} defaultValue={initial?.type} />
          <SelectField id="request_type" label="Request type" options={REQUEST_TYPES} defaultValue={initial?.request_type} />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-1 text-sm font-semibold text-graphite-900">Organization &amp; geography</legend>
        <div className="grid grid-cols-2 gap-4">
          <TextField id="company_name" label="Organization name" defaultValue={initial?.company_name} />
          <SelectField id="no_of_employees" label="No of employees" options={EMPLOYEE_BRACKETS} defaultValue={initial?.no_of_employees} />
          <TextField id="annual_revenue" label="Annual revenue" type="number" defaultValue={initial?.annual_revenue?.toString()} />
          <LinkOrTextField id="industry" label="Industry" options={options.industries} defaultValue={initial?.industry} />
          <LinkOrTextField id="market_segment" label="Market segment" options={options.marketSegments} defaultValue={initial?.market_segment} />
          <LinkOrTextField id="territory" label="Territory" options={options.territories} defaultValue={initial?.territory} />
          <TextField id="city" label="City" defaultValue={initial?.city} />
          <TextField id="state" label="State" defaultValue={initial?.state} />
          <LinkOrTextField id="country" label="Country" options={options.countries} defaultValue={initial?.country} />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-1 text-sm font-semibold text-graphite-900">Ownership &amp; qualification</legend>
        <div className="grid grid-cols-2 gap-4">
          <LinkOrTextField id="lead_owner" label="Lead owner" options={options.owners} defaultValue={initial?.lead_owner} />
          <LinkOrTextField id="company" label="Company" options={options.companies} defaultValue={initial?.company} />
          <SelectField id="qualification_status" label="Qualification status" options={QUALIFICATION_STATUSES} defaultValue={initial?.qualification_status} />
        </div>
        {isEdit && (
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-graphite-900">
              <input type="checkbox" name="disabled" defaultChecked={Boolean(initial?.disabled)} />
              Disabled
            </label>
            <label className="flex items-center gap-2 text-sm text-graphite-900">
              <input type="checkbox" name="unsubscribed" defaultChecked={Boolean(initial?.unsubscribed)} />
              Unsubscribed
            </label>
          </div>
        )}
      </fieldset>

      {state?.error && <p className="text-sm text-alert">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90 disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}

function TextField({
  id,
  label,
  type = "text",
  defaultValue,
}: {
  id: string;
  label: string;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-graphite-900">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        defaultValue={defaultValue}
        className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
      />
    </div>
  );
}

function SelectField({
  id,
  label,
  options,
  defaultValue,
}: {
  id: string;
  label: string;
  options: string[];
  defaultValue?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-graphite-900">
        {label}
      </label>
      <select
        id={id}
        name={id}
        defaultValue={defaultValue ?? ""}
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
      >
        <option value="">—</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function LinkOrTextField({
  id,
  label,
  options,
  defaultValue,
}: {
  id: string;
  label: string;
  options: string[] | null;
  defaultValue?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-graphite-900">
        {label}
      </label>
      {options ? (
        <select
          id={id}
          name={id}
          defaultValue={defaultValue ?? ""}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
        >
          <option value="">— none —</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          name={id}
          defaultValue={defaultValue}
          placeholder="Must match an existing value"
          className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
        />
      )}
    </div>
  );
}
