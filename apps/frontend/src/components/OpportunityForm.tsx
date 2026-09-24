"use client";

import { useActionState, useState } from "react";
import { OpportunityItemsEditor, type OpportunityItemRow } from "@/components/OpportunityItemsEditor";
import { SALES_STAGE_OPTIONS } from "@/lib/salesStageOptions";
import type { ItemOption } from "@/lib/actions/itemLookup";

export type FormState = { error?: string } | undefined;

const OPPORTUNITY_TYPES_FALLBACK = ["Sales", "Support", "Maintenance"];
const EMPLOYEE_BRACKETS = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];

export type PartyOption = { value: string; label: string };

export type OpportunityFormOptions = {
  opportunityTypes: string[] | null;
  territories: string[] | null;
  industries: string[] | null;
  marketSegments: string[] | null;
  customerGroups: string[] | null;
  countries: string[] | null;
  contacts: string[] | null;
  addresses: string[] | null;
  itemOptions: ItemOption[];
  currency: string;
};

export type OpportunityFormInitial = {
  title?: string;
  opportunity_type?: string;
  sales_stage?: string;
  expected_closing?: string;
  probability?: number;
  opportunity_amount?: number;
  territory?: string;
  industry?: string;
  market_segment?: string;
  customer_group?: string;
  no_of_employees?: string;
  annual_revenue?: number;
  website?: string;
  city?: string;
  state?: string;
  country?: string;
  contact_person?: string;
  contact_email?: string;
  contact_mobile?: string;
  whatsapp?: string;
  phone?: string;
  phone_ext?: string;
  customer_address?: string;
  transaction_date?: string;
  items?: OpportunityItemRow[];
};

/**
 * Create/Edit form for Opportunity — same headed-`<fieldset>`-sections shape `LeadForm`
 * established for a draftless (`is_submittable: 0`, `CRM-UNV-004` resolved) CRM entity with
 * more fields than a line-item document strictly needs a multi-tab layout for. `party`
 * (Lead/Customer + which one) is shown only in create mode (`partyOptions` provided) — per
 * `crm-architecture.md` §9.3, `opportunity_from`/`party_name` become the record's identity
 * the moment it's created and are never reassigned afterward (same immutability judgement
 * call `LeadDetailPage` already makes for a Lead's own conversion fields), so the edit form
 * never renders them as inputs at all — the detail page shows them read-only in the header
 * instead.
 */
export function OpportunityForm({
  action,
  options,
  initial,
  partyOptions,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  options: OpportunityFormOptions;
  initial?: OpportunityFormInitial;
  partyOptions?: { leads: PartyOption[]; customers: PartyOption[] };
}) {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(action, undefined);
  const [partyType, setPartyType] = useState<"Lead" | "Customer">("Lead");
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="max-w-3xl space-y-6">
      {partyOptions && (
        <fieldset className="space-y-4">
          <legend className="mb-1 text-sm font-semibold text-graphite-900">Party</legend>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-graphite-900">
              <input
                type="radio"
                name="opportunity_from"
                value="Lead"
                checked={partyType === "Lead"}
                onChange={() => setPartyType("Lead")}
              />
              Lead
            </label>
            <label className="flex items-center gap-2 text-sm text-graphite-900">
              <input
                type="radio"
                name="opportunity_from"
                value="Customer"
                checked={partyType === "Customer"}
                onChange={() => setPartyType("Customer")}
              />
              Customer
            </label>
          </div>
          <div>
            <label htmlFor="party_name" className="mb-1 block text-sm font-medium text-graphite-900">
              {partyType}
            </label>
            <select
              id="party_name"
              name="party_name"
              required
              className="w-full max-w-sm rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
            >
              <option value="">Select {partyType.toLowerCase()}…</option>
              {(partyType === "Lead" ? partyOptions.leads : partyOptions.customers).map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </fieldset>
      )}

      <fieldset className="space-y-4">
        <legend className="mb-1 text-sm font-semibold text-graphite-900">Commercial</legend>
        <div className="grid grid-cols-2 gap-4">
          <TextField id="title" label="Title" defaultValue={initial?.title} />
          <SelectField
            id="opportunity_type"
            label="Opportunity type"
            options={options.opportunityTypes ?? OPPORTUNITY_TYPES_FALLBACK}
            defaultValue={initial?.opportunity_type}
          />
          <SelectField id="sales_stage" label="Sales stage" options={SALES_STAGE_OPTIONS} defaultValue={initial?.sales_stage} />
          <TextField id="expected_closing" label="Expected closing date" type="date" defaultValue={initial?.expected_closing} />
          <TextField id="probability" label="Probability (%)" type="number" defaultValue={initial?.probability?.toString()} />
          <TextField
            id="opportunity_amount"
            label={`Opportunity amount (${options.currency})`}
            type="number"
            defaultValue={initial?.opportunity_amount?.toString()}
          />
          <TextField
            id="transaction_date"
            label="Opportunity date"
            type="date"
            defaultValue={initial?.transaction_date ?? today}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-1 text-sm font-semibold text-graphite-900">Classification</legend>
        <div className="grid grid-cols-2 gap-4">
          <LinkOrTextField id="territory" label="Territory" options={options.territories} defaultValue={initial?.territory} />
          <LinkOrTextField id="industry" label="Industry" options={options.industries} defaultValue={initial?.industry} />
          <LinkOrTextField
            id="market_segment"
            label="Market segment"
            options={options.marketSegments}
            defaultValue={initial?.market_segment}
          />
          <LinkOrTextField
            id="customer_group"
            label="Customer group"
            options={options.customerGroups}
            defaultValue={initial?.customer_group}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-1 text-sm font-semibold text-graphite-900">Organization &amp; geography</legend>
        <div className="grid grid-cols-2 gap-4">
          <SelectField id="no_of_employees" label="No of employees" options={EMPLOYEE_BRACKETS} defaultValue={initial?.no_of_employees} />
          <TextField id="annual_revenue" label="Annual revenue" type="number" defaultValue={initial?.annual_revenue?.toString()} />
          <TextField id="website" label="Website" defaultValue={initial?.website} />
          <TextField id="city" label="City" defaultValue={initial?.city} />
          <TextField id="state" label="State" defaultValue={initial?.state} />
          <LinkOrTextField id="country" label="Country" options={options.countries} defaultValue={initial?.country} />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-1 text-sm font-semibold text-graphite-900">Contact</legend>
        <div className="grid grid-cols-2 gap-4">
          <LinkOrTextField id="contact_person" label="Contact person" options={options.contacts} defaultValue={initial?.contact_person} />
          <LinkOrTextField id="customer_address" label="Address" options={options.addresses} defaultValue={initial?.customer_address} />
          <TextField id="contact_email" label="Contact email" type="email" defaultValue={initial?.contact_email} />
          <TextField id="contact_mobile" label="Contact mobile" defaultValue={initial?.contact_mobile} />
          <TextField id="whatsapp" label="WhatsApp" defaultValue={initial?.whatsapp} />
          <TextField id="phone" label="Phone" defaultValue={initial?.phone} />
          <TextField id="phone_ext" label="Phone ext." defaultValue={initial?.phone_ext} />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-1 text-sm font-semibold text-graphite-900">Products &amp; services (optional)</legend>
        <OpportunityItemsEditor itemOptions={options.itemOptions} initialRows={initial?.items} currency={options.currency} />
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
