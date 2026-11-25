# Kaburlu Admin Implementation Plan

**Date:** 2026-11-21  
**Principles:** No App Router migration; no shadcn replacement; no mock APIs; Express backend contracts unchanged unless documented.

---

## Phase 0 — Done (this audit window)

| Item | Priority | Status |
|------|----------|--------|
| News Desk UI shell (`PageHeader`, `Section`, tabs) | P2 | **Done** |
| Tenant targets density + web URL column | P1 | **Done** |
| `articleUrl` in tenant-outcomes (`/articles/{slug}`) | P1 | **Done** |
| `ensureOrphanV2Pipeline` P2002 race | P0 | **Done** |
| Admin 500 white screen (`.next` cache) | P0 | **Mitigated** (`dev:clean`) |
| Publish readiness bar + legacy deep link `?jobId=` | P1 | **Done** |

---

## Phase 1 — W3 V2 native publish (2026-11-21)

### 1. News Desk V2 web publish — **Shipped (dev)**

- **Design:** `kaburlu_media_backend/docs/NEWS_DESK_W3_PUBLISH_DESIGN.md`
- **Backend:** `publish-web`, eligibility on `publish-capabilities`, `assertLegacyPublishAllowedForJob` → **409** `V2_USE_PUBLISH_WEB`
- **Admin:** Eligibility counts, last publish run summary, duplicate-submit guard (`publishing` flag)
- **Legacy:** Generate + publish unchanged for jobs **without** pipeline row
- **Remaining:** Staging repeat of `npm run test:newsdesk-w31-smoke`; optional CI gate

### 1.1 Production hardening (done locally)

- `npm run test:newsdesk-w31-smoke` — JWT capabilities + concurrent publish + DB article check
- `skipApproval` RBAC + audit (`PUBLISH_APPROVAL_OVERRIDE_DENIED` for `NEWS_DESK`)
- Create intake: `NewsDeskLocationSearch` (master district/mandal)

### 2. Operational stability

- Document `npm run dev:clean` in admin README.
- Pre-deploy: `agent:preflight` backend + `preflight:deploy` admin.
- Local: single API on `3011` (avoid port collision logs).

### 3. Integration verification script

- Extend `npm run test:newsdesk` with tenant-outcomes shape test (mock fetch).
- Smoke: list + snapshot + outcomes for one known job id (env-gated).

---

## Phase 2 — P2 (module waves)

| Wave | Module | Work |
|------|--------|------|
| A | News Desk | Location picker (optional districts API); bulk review |
| B | Tenants | Tab consistency, table density |
| C | Reporter insights | Loading timeout + empty states |
| D | Daily newspaper / articles admin | Align with unified article APIs |
| E | Platform billing | Wallet list pagination UX |
| F | ePaper | Header/block studio — separate sprint (large files) |

Each wave: 1 PR, preflight, no cross-module refactors.

---

## Phase 3 — P3 polish

- Shared `AdminPageHeader` / `AdminSection` (extract from News Desk).
- Sidebar dedupe; active state audit.
- Typography pass (`text-2xl font-semibold` standard).
- Dark mode — only if product requests (not in scope today).

---

## Definition of done (per fix)

1. Root cause in gap or UX audit doc.
2. API contract unchanged or documented in `NEWS_DESK_V2_API_REFERENCE.md`.
3. `npm run build` (admin) pass.
4. Targeted tests run and noted in `ADMIN_QA_REPORT.md`.
5. Manual smoke on affected route.

---

## Out of scope (explicit)

- NestJS migration (N/A).
- shadcn/ui full adoption.
- Production deploy without user `DEPLOY` approval.
- Rewriting epaper designer monolith in one pass.