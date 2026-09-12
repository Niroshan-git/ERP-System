# frontend

Next.js app (App Router, TypeScript, Tailwind v4), deployed on Vercel
(`PLAN.md` Week 7–8). Mobile-first dashboard: live machine status cards, OEE
gauges, active Work Orders/Job Cards list, downtime log. Authenticates
against ERPNext via API key/token; pulls data from the ERPNext REST API and
from `mes-service` / Postgres. PWA-installable (stretch).

## Branding

Ceylon Stack design tokens live in `src/app/globals.css` (`:root` +
`prefers-color-scheme: dark` blocks, mapped into Tailwind via `@theme
inline`) — mirrors `/DESIGN.md` and `/docs/brand.md` at the repo root.
Fonts (Fraunces / Archivo / IBM Plex Sans / IBM Plex Mono) are loaded via
`next/font/google` in `src/app/layout.tsx`. Logo/favicon assets are in
`public/brand/`, copied from `docs/brand/`.

If the tokens in `DESIGN.md` ever change, update `globals.css` to match —
don't hand-pick colors outside that set.

## Getting started

```bash
npm install
npm run dev
```

Runs at http://localhost:3000. `src/app/page.tsx` is currently a static,
on-brand placeholder (KPI tiles, status pills, a Job Card table) standing in
for the real dashboard until ERPNext API integration starts.

## Not yet done

- ERPNext REST API client / auth
- `mes-service` data integration
- Real dashboard screens (machine status, OEE gauges, downtime log)
- PWA manifest / installability
- Optional stretch: a Three.js digital-twin view of the factory floor
