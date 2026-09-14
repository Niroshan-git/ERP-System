# DESIGN.md — Ceylon Stack Brand & UI/UX

**Status: approved** for brand identity — naming, logo/mark, voice & tone,
and everything marketing-facing (decks, docs, the "What's Underneath"
answer). Live interactive version (logo lockups, color swatches, type
specimens): see the published brand page — link kept in `docs/brand.md`
alongside the copy-paste token values for code.

**Superseded for `apps/frontend` itself:** the product UI (the actual
working app — Sales, Manufacturing, etc.) follows
`docs/brand/package/ceylon-stack-frontend-design.md` instead of the color
(§3) and typography (§4) tokens below. That doc is the industrial-functional
system (graphite neutrals, one teal accent, IBM Plex Sans/Mono only) built
for a screen people scan for hours a day — the Fraunces/Archivo/
sapphire-cinnamon system below reads as a marketing/brand-identity system,
which is what it's for now. ERPNext Desk branding (§6.1) and marketing
docs/decks still draw from this file's tokens as written.

## 1. Naming & Positioning

**Product name:** Ceylon Stack.
"Smart Factory on ERPNext" remains the accurate internal/technical
description (see `CLAUDE.md`) — use it when explaining the underlying stack
to a technical audience; use "Ceylon Stack" everywhere client- or
marketing-facing.

**Why "Ceylon Stack":**
- *Ceylon* — the name the world already trusts this island for: tea,
  cinnamon, sapphires. Signals origin and quality without a slogan, and
  reads as trustworthy to a Sri Lankan factory owner wary of another
  overseas SaaS logging into their production floor.
- *Stack* — literal: shop-floor sensors, an MES layer, ERPNext at the core,
  analytics on top, sold and supported as one product. Also the visual idea
  behind the mark: layers, cut like a gemstone.

**Positioning line:** *"Ceylon Stack — the smart factory platform for
manufacturers who need more than a spreadsheet and less than an SAP
rollout."*

## 2. Mark & Logo Assets

A gemstone in profile, cut into three bands — shop floor, MES layer, and
ERPNext, faceted into one stone. Single-ink, legible down to favicon size.

Asset files (in `docs/brand/`):

| File | Use |
|---|---|
| `logo-mark.svg` | Vector source, sapphire ink — primary, for light backgrounds |
| `logo-mark-reverse.svg` | Vector source, light ink — for dark backgrounds |
| `app-logo-512.png` | Raster export, sapphire — ERPNext Website Settings → App Logo |
| `favicon-256.png` / `-192.png` / `-64.png` / `-32.png` / `-16.png` | Raster favicon exports at common sizes |
| `logo-mark-reverse-512.png` | Raster export, light ink, for dark surfaces |

**Clear space:** half the mark's height on every side. **Never** stretch
off-ratio, recolor per-band, or use the mark in any color outside the
palette below.

## 3. Color

Not a color-picker palette — colors that already mean something on this
island before they mean "success/warning/error" on a screen.

| Token | Name | Light | Dark | Role |
|---|---|---|---|---|
| `--sapphire` | Sapphire | `#21407A` | `#6E93D8` | Brand primary — nav, links, focus, primary buttons |
| `--cinnamon` | Cinnamon | `#A85C31` | `#D89566` | Secondary accent — highlights, secondary CTAs |
| `--tea` | Tea | `#3D7A56` | `#6FBE90` | Status: good / running / positive delta |
| `--turmeric` | Turmeric | `#B87A1E` | `#E3AA52` | Status: warning / needs attention |
| `--terracotta` | Terracotta | `#AD4034` | `#E17A6B` | Status: critical / down / error |
| `--bg` | Paper / Graphite | `#F2F4F9` | `#10131A` | Page background |
| `--surface` | — | `#FFFFFF` | `#161A23` | Cards, panels |
| `--surface-alt` | — | `#E9EDF4` | `#1D2230` | Tiles, table stripes |
| `--border` | — | `#D6DDE8` | `#2A3142` | Dividers, card borders |
| `--ink` | — | `#181E2B` | `#E9EDF6` | Primary text |
| `--ink-soft` | — | `#525C70` | `#A6B0C4` | Secondary text |
| `--ink-faint` | — | `#7C8598` | `#78829A` | Captions, labels |

**Rule:** sapphire and cinnamon are brand colors, never status colors.
Status is always tea / turmeric / terracotta, and always paired with a
label or icon — never color alone. This matters more than usual here:
factory-floor screens get read in bright sun, under sodium lighting, by
tired eyes, and possibly by someone with a color-vision deficiency.

## 4. Typography

| Role | Face | Where |
|---|---|---|
| Display | **Fraunces** | Brand voice, marketing headlines, the wordmark itself |
| UI | **Archivo** | Dashboard headings, KPI labels, nav |
| Body & data | **IBM Plex Sans** / **IBM Plex Mono** | Paragraphs, tables, IDs, anything tabular (Plex Mono for tabular-nums figures) |

Google Fonts import:
```
https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300..900;1,300..900&family=Archivo:wght@500;600;700;800&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap
```

Type scale: 12 (caption) · 14 (label) · 16 (body) · 20 (h3) · 28 (h2) · 40+ (display)

## 5. Voice & Tone

- **Direct, not cute** — "Machine down since 14:22", never "Uh oh, looks
  like something's wrong!"
- **Name real things** — Job Card, Work Order, OEE: the terms the floor and
  the ERP both already use. Never invent softer synonyms.
- **Numbers first** — lead with the figure, then the verdict: "71.4% —
  below target" reads faster than a sentence explaining it.
- **No apology copy** — errors say what broke and what to do next. No
  "Oops!", no exclamation marks on a stoppage.

## 5a. The "What's Underneath" Answer

If a client, partner, or investor asks what's under the hood — this is the
answer, verbatim, every time (don't let it drift person to person):

> "Ceylon Stack is built on ERPNext, an open-source ERP platform used by
> 30,000+ companies worldwide. We've made it compatible with how Sri
> Lankan manufacturers actually work, and layered on the real-time factory
> floor and automation/AI capabilities that ERPNext doesn't have out of
> the box."

Rules for using it:
- Lead with Ceylon Stack in marketing/decks — this line is for when
  someone asks directly, not the headline pitch.
- The "30,000+ companies" figure is Frappe's own published number
  (frappe.io/erpnext) — verifiable, don't inflate it or add a country
  count that isn't published anywhere.
- Never claim the ERP core (accounting, inventory, manufacturing engine)
  was built in-house. What *is* honestly Ceylon Stack's own: the Sri
  Lanka fit, the MES/OEE real-time layer, and the automation/AI layer —
  say that part with full confidence, because it's true.

## 6. Applying It — Rollout Order

1. **ERPNext Desk (now):** Website Settings → App Name = "Ceylon Stack",
   upload `app-logo-512.png` as App Logo, a favicon size as Favicon. No
   core edit — this is a supported settings change.
2. **Full Desk color pass:** once `apps/smart_factory` exists, add an
   `app_include_css` hook injecting the tokens above into Desk's theme —
   a supported customization point, not a core edit.
3. **`apps/frontend`:** bake these tokens into the Tailwind/CSS config
   before any screen gets built, so every component starts on-brand.
4. **Docs & decks:** use "Ceylon Stack" in the pitch deck and any
   client-facing doc; "Smart Factory on ERPNext" stays fine internally.

## 7. Applied Preview

See the published brand page (link in `docs/brand.md`) for the mini
dashboard mock — KPI tiles, status pills, a Job Card table row — showing
these tokens on an actual factory-dashboard-shaped layout, not just swatches.
