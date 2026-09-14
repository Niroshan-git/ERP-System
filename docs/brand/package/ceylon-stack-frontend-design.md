# Ceylon Stack — Frontend Design System

This is a working tool, not a marketing site: factory floor operators, sales staff, and managers will live in this interface for hours a day. The design has to prioritize legibility, speed of scanning, and clear status signaling over visual flourish. Built for the Sales module first (Customer, Item, Quotation, Sales Order), extending to Manufacturing next.

---

## Design Plan

### Color

An industrial-functional palette — cool graphite neutrals with one deliberate accent, not the warm cream/terracotta or dark-mode-neon combinations that read as generic AI-generated defaults.

| Token | Hex | Use |
|---|---|---|
| `graphite-900` | `#12161C` | Primary text, sidebar background |
| `graphite-500` | `#5B6470` | Secondary/muted text |
| `surface` | `#FFFFFF` | Card/panel backgrounds |
| `canvas` | `#F3F5F4` | App background (cool off-white, not cream) |
| `signal` | `#2E6F5E` | Primary accent — actions, active states, links |
| `alert` | `#C4531D` | Warnings, overdue items, validation errors |
| `success` | `#3C7A4F` | Completed/approved states |

Status colors (Draft/Submitted/Completed, Overdue, etc.) reuse `signal`/`alert`/`success` consistently rather than introducing a new color per status — status meaning should be learnable at a glance across every module.

### Type

Two families, clearly distinct roles:

- **IBM Plex Sans** — all UI text: headings, labels, body, buttons, nav. Has a technical/industrial heritage that fits the subject without leaning on the default Inter/system-font look.
- **IBM Plex Mono** — reserved strictly for functional data: document numbers (SO-0001), SKUs, timestamps, quantities in dense tables. This is a working distinction (machine-readable data vs. human copy), not decoration — never used for headings or labels.

Type scale: 14px base for table/list density, 16px for form fields, 20/24/32px for page/section headings. Line length capped under 80 characters on forms and detail panels.

Avoid: all-caps labels, tracked-out eyebrow text above headings, accenting single words in headlines. Labels are sentence case, plain.

### Layout

Left-aligned throughout — this is a scanning tool, not a persuasive page. No centered marketing-style composition.

```
┌─────────┬──────────────────────────────────────────┐
│         │  Topbar: breadcrumb · search · [🔔] · user│
│ Sidebar ├──────────────────────────────────────────┤
│  Sales  │  Page heading            [+ New]          │
│  ▸ Cust │  ┌────────────────────────────────────┐   │
│  ▸ Item │  │ Filter bar                          │   │
│  ▸ Quot │  ├────────────────────────────────────┤   │
│  ▸ SO   │  │ Data table (mono for IDs/dates)     │   │
│         │  │                                      │   │
│  Mfg    │  └────────────────────────────────────┘   │
│  (soon) │                                            │
└─────────┴──────────────────────────────────────────┘
```

Sidebar stays fixed and collapsible; module grouping mirrors the rollout order (Sales live, Manufacturing greyed-in-progress) so the product visibly grows rather than pretending to be complete.

### Principles

1. **Status is the hierarchy.** Draft/Submitted/Completed, overdue, and error states must be the most visually distinct thing on any screen — everything else stays quiet.
2. **One accent, spent deliberately.** `signal` teal marks the primary action per screen (one filled button); everything else is outline/ghost.
3. **Motion only answers action.** A real-time socket update (new notification, status change) animates in with a brief highlight-and-settle — no scroll-triggered fades, no hover effects on every row.
4. **Density over whitespace.** Tables and forms follow the actual data density of ERP work — this is not a spacious SaaS landing page.

---

## Plan Review (what was deliberately avoided)

- Rejected the cream-background/serif-display/terracotta-accent combination — too close to a generic "AI-generated" default and wrong register for a data-dense operational tool.
- Rejected the SaaS rounded-card kit with uniform shadows — Sales/Manufacturing data reads better as tables and dense panels than as decorative cards.
- Rejected all-caps eyebrow labels and monospace-for-everything — monospace is scoped only to genuinely machine-readable data (IDs, timestamps), which is a functional choice tied to this subject, not a stylistic tell.

---

## Screen Specs (Phase 1: Sales)

### Login

- Centered single card on `canvas` background, no split-screen hero image (nothing to sell — this is a tool login).
- Fields: email, password, "Remember me," forgot-password link (wired to Frappe's `reset_password` method).
- Errors render inline under the field in `alert` color, plain language ("Incorrect email or password" — never a raw API error string).

### Notifications

- Bell icon in topbar, badge count sourced from Frappe's `Notification Log`.
- Dropdown panel: unread items bolded, grouped by "Today" / "Earlier."
- Live items (socket.io `doc_update` events — e.g., "Sales Order SO-0004 approved") insert at the top with the brief highlight-and-settle animation from Principle 3.
- Empty state: plain sentence — "No notifications yet" — not an illustration.

### Customer / Item (list + form)

- List: filter bar (status, date range, search) above a dense table; mono type for codes/dates.
- Form: single column under 80-character line length, section dividers only where the doctype's own field groups warrant them (not decorative).

### Quotation / Sales Order (form with child table + workflow)

- Header fields top, line-items child table below (mono for item code/qty/rate/amount columns).
- Status badge (Draft/Submitted/Completed) uses the shared status color system — placed next to the document title, not buried in a sidebar.
- Submit action is the single `signal`-colored button on the page; Save/Cancel stay outline.

---

## Build Notes

- Component library: shadcn/ui + Tailwind, restyled to these tokens (override default Tailwind palette with the table above — don't layer new colors on top of shadcn defaults).
- Keep interactive keyboard focus visible on every control (tables, buttons, form fields) — this is a daily-use tool, not a demo.
- Respect `prefers-reduced-motion` for the notification highlight animation.
