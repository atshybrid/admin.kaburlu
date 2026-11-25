# Kaburlu Admin ↔ Backend Gap Analysis

**Date:** 2026-11-21  
**Scope:** `admin.kaburlu` (Next.js 13.5 Pages Router) ↔ `kaburlu_media_backend` (Express + TypeScript + Prisma)

> **Architecture note:** The production API is **Express** mounted at `/api/v1`, not NestJS. This document uses “module” for route groups (e.g. `platformNewsDesk.routes.ts`).

## Inventory summary

| Area | Count | Notes |
|------|------:|-------|
| Admin `pages/admin/*` routes | **54** | Files under `pages/admin/` |
| Dedicated `lib/api/services/*` | **41** | Plus `lib/api/tenantApi.js`, proxy |
| Backend route modules (`src/api/**`) | **~120** | ~750+ HTTP verb registrations (grep) |
| News Desk UI routes | **5** | list, create, detail, settings, legacy syndication bridge |

## Integration patterns

| Pattern | Location | Risk |
|---------|----------|------|
| Browser → `/api/proxy/*` → backend | `pages/api/proxy/[...path].js` | CORS-safe; depends on `NEXT_PUBLIC_BACKEND_URL` |
| Direct server fetch | Some BFF routes under `pages/api/admin/` | Must set `KABURLU_BACKEND_URL` |
| JWT | `localStorage` + `Authorization` header | 401 if token stale; no refresh in all flows |

---

## Priority gap table (representative — not exhaustive)

| Module | Backend API | Admin Page | Integration Status | Missing Feature | Priority |
|--------|-------------|------------|-------------------|-----------------|----------|
| News Desk V2 | `GET/POST /platform/newsdesk/*` | `/admin/news-desk/*` | **Integrated** (list, snapshot, facts via syndication, staff, routing) | In-app **V2 web publish** (blocked: legacy `generate` on pipeline jobs) | **P1** |
| News Desk V2 | `GET .../tenant-outcomes` (+ `articleUrl`) | Detail tenants table | **Integrated** (2026-11-21) | Bulk publish per tenant from desk without legacy desk | **P1** |
| Platform Syndication | `POST /platform/syndication/jobs/:id/generate` | `/admin/platform-syndication?legacy=1` | **Partial** | V2 jobs → **409** `PIPELINE_IN_PROGRESS` | **P1** |
| Platform Syndication | `POST .../publish` | Legacy desk step 3 | **Partial** | Requires `masterPrintJson`; not filled by V2 pipeline alone | **P1** |
| News Desk | `PATCH .../tenants/:id/review` | Detail review | **Integrated** | No bulk publish after approve | **P2** |
| News Desk | Routing rules CRUD | Settings → Routing | **Integrated** | Engine consumer W3+ not in admin feedback loop | **P3** |
| Tenants | `31` routes `tenants.routes.ts` | `/admin/tenants`, tabs | **Integrated** (heavy) | Some domain/SEO tabs vs backend parity varies by tab | **P2** |
| ePaper | `104` routes `epaper.routes.ts` | `/admin/epaper/*` (15 pages) | **Integrated** (complex) | Many designer routes; separate BFF proxies | **P2** |
| Journalist Union | `journalist.routes.ts` + union * | `/admin/journalist-union`, surveys | **Integrated** via `journalistApi`, `unionSurveysApi` | Survey route fallbacks (multiple paths) | **P2** |
| Reporter Insights | `/tenant-reporter-insights` | `/admin/reporter-insights` | **Integrated** | Timeout on large tenants (known perf) | **P2** |
| I&PR Empanelment | `iprEmpanelment.routes.ts` | `/admin/ipr-empanelment` | **Integrated** | — | **P3** |
| Platform Billing | `platformBillingAdmin.routes.ts` | `/admin/tenant-wallets`, billing | **Integrated** | — | **P2** |
| News Cartoons | platform + public routes | `/admin/news-cartoons` | **Integrated** | Role gate must match backend | **P2** |
| News Banners/Surveys | admin + superadmin routes | `/admin/news-banners`, `news-surveys` | **Integrated** | — | **P3** |
| Political Parties | `politicalParties.routes.ts` | `/admin/political-parties` | **Integrated** | — | **P3** |
| Readers | `readers.routes.ts` | `/admin/readers` | **Integrated** | — | **P3** |
| Articles (legacy admin) | `/articles/*` unified + list | `/admin/articles` | **Integrated** | Overlaps with smart-articles / desk flows | **P2** |
| Locations | states/districts/mandals | `/admin/locations/*` | **Integrated** | News Desk uses **free-text** location, not these CRUD pickers | **P2** |
| Dashboard overview | `/dashboard/*` | `/admin` | **Partial** | Not all stats wired for desk-only users | **P3** |
| AI Desk | `/ai-desk/*` | No dedicated top-level nav | **Backend only** | Optional admin surface | **P3** |
| Digital clip ads | multiple route files | Limited / tenant-scoped | **Partial** | Superadmin surfaces thin | **P2** |
| Secure messages | `secureMessages.routes.ts` | No admin inbox page | **Backend only** | By design (mobile) | **P3** |
| Public website | `/public/*` | N/A (not admin) | **N/A** | — | — |

---

## APIs with no Admin UI (by design or backlog)

- Most `/public/*` and `/public/reader/*` — consumer sites, not admin.
- Reporter mobile flows (`/reporters/me/*`, wallet, autopay) — React Native app.
- `/shortnews/read`, reactions — reader app.
- **AI test** `/ai` health — ops only.

## Admin UI with weak / indirect API

| UI | Issue | Priority |
|----|-------|----------|
| News Desk “AI generate & publish” | Opens legacy syndication; **generate blocked** when V2 pipeline exists | P1 |
| Platform desk nav | `news-desk` not in all sidebars until role `BACKEND_SYNDICATION_DESK_ROLES` | P2 |
| All Articles vs News Desk | Desk users may confuse list sources (`/articles` vs `/platform/newsdesk/jobs`) | P2 |

---

## Security / data (P0) — status

| Issue | Status |
|-------|--------|
| Tenant scope on list (`allowedTenantIds`) | Enforced backend; admin respects scope |
| `body.tenantId` trust on desk intake | Rejected for reporters (backend) |
| JWT on all `/platform/newsdesk` | Yes (`requireSyndicationDeskRole`) |
| Orphan V2 pipeline race `P2002` on concurrent backfill | **Fixed** 2026-11-21 (`ensureOrphanV2Pipeline.ts`) |

---

## Recommended next implementation waves

1. **P1** — Product decision: V2-native publish path OR documented legacy-only workflow with generate-from-facts bridge (backend W3).
2. **P1** — News Desk: disable/hide “publish” until `masterPrint` exists; clearer copy (already started in `NewsDeskPublishBar`).
3. **P2** — Location: optional link News Desk hint → admin location master data (no schema change).
4. **P2** — Module-by-module UI density pass (tables/forms) per `ADMIN_UI_UX_AUDIT.md`.
5. **P3** — Overview dashboard cards for desk-only roles.

---

## References

- `docs/architecture/NEWS_DESK_FRONTEND_FLOW_ANALYSIS.md`
- `docs/architecture/NEWS_DESK_V2_API_REFERENCE.md`
- Backend mount list: `kaburlu_media_backend/src/app.ts` (`apiV1.use`)