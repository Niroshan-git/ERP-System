# Brand — Ceylon Stack

Full written design system: see `DESIGN.md` at the project root (approved).
Interactive version (logo lockups, color swatches, type specimens, applied
dashboard preview): https://claude.ai/code/artifact/74dba964-aa2f-403b-bf38-ac28a8a578cc
Logo/favicon asset files: `docs/brand/`.

This file is the developer-facing quick reference — copy these tokens
straight into `apps/frontend`'s Tailwind/CSS config and the `smart_factory`
`app_include_css` hook once that exists. Don't hand-pick colors outside
this set for anything client-facing.

## Color tokens

| Token | Light | Dark | Use |
|---|---|---|---|
| `--sapphire` (brand primary) | `#21407A` | `#6E93D8` | nav, links, focus states, primary buttons |
| `--cinnamon` (secondary accent) | `#A85C31` | `#D89566` | highlights, secondary CTAs |
| `--tea` (status: good) | `#3D7A56` | `#6FBE90` | machine running / OK / positive delta |
| `--turmeric` (status: warning) | `#B87A1E` | `#E3AA52` | degraded, needs attention |
| `--terracotta` (status: critical) | `#AD4034` | `#E17A6B` | stoppage, breach, error |
| `--bg` | `#F2F4F9` | `#10131A` | page background |
| `--surface` | `#FFFFFF` | `#161A23` | cards, panels |
| `--surface-alt` | `#E9EDF4` | `#1D2230` | tiles, table stripes |
| `--border` | `#D6DDE8` | `#2A3142` | dividers, card borders |
| `--ink` | `#181E2B` | `#E9EDF6` | primary text |
| `--ink-soft` | `#525C70` | `#A6B0C4` | secondary text |
| `--ink-faint` | `#7C8598` | `#78829A` | captions, labels |

**Rule:** sapphire and cinnamon are brand colors, never status colors.
Status is always tea / turmeric / terracotta, always paired with a label —
never color alone (factory-floor readability, accessibility).

## Typography

- **Display** (brand voice, marketing headlines): Fraunces
- **UI** (dashboard headings, KPI labels): Archivo
- **Body & data** (paragraphs, tables, IDs): IBM Plex Sans / IBM Plex Mono for tabular data

Google Fonts import:
```
https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300..900;1,300..900&family=Archivo:wght@500;600;700;800&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap
```

## Naming

**Product name:** Ceylon Stack
**Positioning line:** "Ceylon Stack — the smart factory platform for manufacturers who need more than a spreadsheet and less than an SAP rollout."
Internal/technical docs can still say "Smart Factory on ERPNext" when it's useful to be explicit about the underlying stack — that's not a competing name, just the technical description.

## Rollout status

- [ ] ERPNext Desk: App Name, App Logo, Favicon (Website Settings — no core edit)
- [ ] ERPNext Desk: full color pass via `app_include_css` hook (needs `smart_factory` app to exist first)
- [ ] `apps/frontend`: bake these tokens into the Tailwind/CSS config before building screens
- [ ] Swap product name in pitch deck / client-facing docs
