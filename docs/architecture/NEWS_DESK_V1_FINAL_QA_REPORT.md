# News Desk V1 — Final QA & Regression Audit

**Date:** 2026-11-20  
**Auditor scope:** Frontend `admin.kaburlu` only (no commit, deploy, or backend changes).  
**References:** `NEWS_DESK_V1_FRONTEND_DELIVERY.md`, backend `listNewsDeskJobsQuery.ts`, `getSnapshotByJobId.ts`, `getFactsByJobId.ts`.

---

## Executive summary

| Category | Result |
|----------|--------|
| Automated tests | **PASS** (8/8) |
| Production build | **PASS** |
| Code vs API contract | **PASS** (static) |
| Legacy syndication diff | **PASS** (zero changes) |
| Live E2E (auth + API) | **PENDING** (local backend down; no desk JWT in CI) |
| Production API probe | **NOTE** — `GET /platform/newsdesk/jobs` returned **404** on `api.kaburlumedia.com` (route may not be deployed yet) |

**Commit recommendation:** **Approve for commit after staging manual sign-off** — pre-commit fixes applied (RBAC, refresh, polling); block production deploy until backend News Desk V1 routes are live and manual Tests 1–3 + 7 pass on staging.

---

## Pre-commit fixes (2026-11-20)

| # | Issue | Fix | Tests |
|---|--------|-----|-------|
| 1 | News Desk nav/gate used broad `canAccessSyndication` | `canAccessNewsDesk` + `BACKEND_SYNDICATION_DESK_ROLES` aligned with backend `SYNDICATION_DESK_ROLES`; nav `news-desk` item uses same list; **Platform Syndication** nav unchanged | `platformRoles.test.mjs` |
| 2 | Dashboard Refresh only reloaded list | `refreshNewsDeskDashboard` runs `loadStats` + `loadList` in parallel; Refresh button calls `onRefresh` | `dashboardRefresh.test.mjs` |
| 3 | Polling only when `extractionStatus === 'EXTRACTION_PENDING'` | `shouldPollExtraction()` (includes `RAW_ACCEPTED`, etc.); hook resets on `jobId`/`enabled` change for retry & navigation return | `extractionPolling.test.mjs` (extended) |

**Post-fix automation:** `npm run test:newsdesk` → **8/8 pass**; `npm run build` → **pass**.

---

## Test 8: Quality (automated)

### Commands run

```text
npm run test:newsdesk  → 8 tests, 0 failures
npm run build          → success (News Desk routes present)
```

### Unit coverage added during audit

| File | Covers |
|------|--------|
| `lib/newsDesk/__tests__/buildIntakePayload.test.mjs` | V2 flag, `tenants: []`, image array order |
| `lib/newsDesk/__tests__/extractionPolling.test.mjs` | Terminal statuses, poll gating |
| `lib/newsDesk/__tests__/newsDeskApi.test.mjs` | List query mapping, error message mapping |
| `lib/newsDesk/__tests__/platformRoles.test.mjs` | `canAccessNewsDesk` vs backend desk roles |
| `lib/newsDesk/__tests__/dashboardRefresh.test.mjs` | Parallel stats + list refresh |

### Other frontend test suites

No repository-wide `npm test` exists outside `test:newsdesk` and ePaper service packages. No additional admin-app unit suites were run.

---

## Test 1: Authenticated UI

| Check | Result | Evidence |
|-------|--------|----------|
| Routes registered | **PASS** | Build output: `/admin/news-desk`, `/create`, `/[jobId]` |
| Access gate component | **PASS** | `NewsDeskAccessGate` → `canAccessSyndication(user)` |
| Loading states | **PASS** (code) | `Spinner` on dashboard list, create meta, detail `loadAll` |
| Empty list | **PASS** (code) | `NewsDeskJobTable` → `EmptyState` when `items.length === 0` |
| Error states | **PASS** (code) | `toast.error(formatNewsDeskError(...))` on API failures |
| Success navigation after create | **PASS** (code) | `router.push(/admin/news-desk/:id)` after V2 create |
| **Authenticated screenshots** | **PENDING** | Local dev without desk JWT redirects to login; no token stored in repo (by design) |

### Screenshots

| Screen | Status |
|--------|--------|
| Dashboard | **PENDING** — requires desk JWT |
| Create | **PENDING** |
| List (populated) | **PENDING** |
| Detail / facts | **PENDING** |
| Unauthenticated gate | Observed: redirect to login (not News Desk layout) |

---

## Test 2: Intake

| Check | Result | Notes |
|-------|--------|-------|
| Payload `options.newsDeskPipelineV2: true` | **PASS** | `buildNewsDeskIntakePayload` + unit test |
| No `autoGenerate` | **PASS** | Unit test asserts undefined |
| `tenants: []` | **PASS** | Explicit in payload builder |
| `images` as URL array (order preserved) | **PASS** | Array from state order; unit test |
| Upload via media BFF | **PASS** (code) | `uploadMedia(file, 'news-desk')` |
| Pipeline validation on response | **PASS** | `assertV2CreateResponse` requires `response.pipeline` |
| Duplicate submit prevention | **PASS** | `if (submitting) return` + disabled UI |
| Live POST + snapshot | **PENDING** | `NEXT_PUBLIC_BACKEND_URL=http://localhost:3011` — backend **not reachable** during audit |

### Example request body (sanitized — no secrets)

```json
{
  "rawText": "…article body…",
  "headline": "QA test headline",
  "category": { "categoryId": "<category-uuid>" },
  "sourceUrl": "https://example.com/story",
  "sourceAttribution": { "type": "DESK" },
  "locationHint": { "note": "Test district" },
  "images": [
    "https://cdn…/image-1.jpg",
    "https://cdn…/image-2.jpg",
    "https://cdn…/image-3.jpg"
  ],
  "options": {
    "newsDeskPipelineV2": true,
    "languageCode": "te"
  },
  "tenants": []
}
```

### Expected create response shape (backend contract)

```json
{
  "success": true,
  "job": { "jobId": "<uuid>", "status": "DRAFT", "…" },
  "pipeline": {
    "id": "<pipeline-uuid>",
    "status": "RAW_ACCEPTED",
    "generationNote": "…"
  }
}
```

---

## Test 3: Extraction

| Check | Result | Notes |
|-------|--------|-------|
| Poll `GET …/facts` while pending | **PASS** (code) | `useFactsPolling`, 8s interval, in-flight guard |
| Stop on `EXTRACTION_SUCCEEDED` / `FAILED` | **PASS** | `isTerminalExtractionStatus` + unit test |
| Cleanup on unmount / disabled | **PASS** (code) | `useEffect` return clears timer; `stoppedRef` |
| Retry `POST …/retry-extraction` | **PASS** (code) | `NewsDeskDetailView.onRetry` + error mapping |
| Error codes surfaced | **PASS** | `EXTRACTION_ALREADY_COMPLETE`, `EXTRACTION_IN_PROGRESS`, `PIPELINE_NOT_FOUND` |
| Live worker / facts JSON | **PENDING** | Requires running backend + worker |
| Extraction polling init | **FIXED** | `shouldPollExtraction()` drives detail polling and in-progress banner; hook re-initializes on `jobId`/`enabled` (return navigation, post-retry). |

---

## Test 4: Snapshot integrity

| Check | Result | Evidence |
|-------|--------|----------|
| Detail uses snapshot API only for original body | **PASS** | `newsDeskApi.getSnapshot(jobId)` only |
| No `getJob` / `SyndicationJob.rawText` on detail | **PASS** | Grep: News Desk components use `snapshot.articleText` |
| Original panel labeling | **PASS** | “Immutable snapshot” + `acceptedAt` |
| Facts not conflated with original | **PASS** | Separate panels; facts disclaimer text |

---

## Test 5: List & dashboard counts

| Check | Result | Notes |
|-------|--------|-------|
| Endpoint | **PASS** | `GET /platform/newsdesk/jobs` |
| Query params | **PASS** | `q`, `pipelineStatus`, `extractionStatus`, `categoryId`, `fromDate`, `toDate`, `sort`, `order`, `page`, `pageSize` — `buildNewsDeskListQuery` + unit test |
| Server-side pagination | **PASS** | `page` / `total` from API |
| Filters require **Apply** | **PASS** (UX) | Documented behavior; not live on keystroke |
| Dashboard counts from `total` | **PASS** | Four parallel list calls with `pageSize: 1`, not current page rows |
| Stats vs list filters independent | **PASS** | Stats load on mount only; global totals (not narrowed by table filters) |
| Image count column | **N/A** | List API item type has no image count; UI correctly omits |
| Live filter/pagination E2E | **PENDING** | Backend unavailable |
| Dashboard Refresh | **FIXED** | Refresh reloads list and all four stat queries. |

---

## Test 6: Security

| Check | Result | Notes |
|-------|--------|-------|
| Desk API auth | **PASS** (backend contract) | Routes use `requireSyndicationDeskRole` |
| Frontend gate | **PASS** (soft) | `NewsDeskAccessGate` / nav `SYNDICATION_ROLES` |
| Frontend vs backend role mismatch (News Desk) | **FIXED** | News Desk nav + `NewsDeskAccessGate` use `canAccessNewsDesk` (backend desk roles only). Platform Syndication still uses `canAccessSyndication`. |
| Token in News Desk UI/logs | **PASS** | No `console.log` of tokens in `components/dashboard/newsDesk` or `lib/newsDesk` |
| Token in job detail UI | **PASS** | Only `jobId` shown (UUID, not JWT) |
| Expired JWT handling | **PARTIAL** | `formatNewsDeskError` for 401/403; `DashboardLayout` validates token presence on mount only — may not auto-redirect on mid-session expiry (pre-existing app pattern). |
| Unauthenticated API (prod probe) | **INFO** | See evidence below — 404, not 401 (deployment/routing) |

### API evidence (secrets redacted)

```http
GET https://api.kaburlumedia.com/api/v1/platform/newsdesk/jobs?page=1&pageSize=1
Authorization: (none)

HTTP/1.1 404
{"error":"Not Found"}
```

Interpretation: Production may not yet expose News Desk V1 routes; staging/local with V2 enabled backend required for auth 401/403 matrix.

---

## Test 7: Legacy regression (Platform Syndication)

| Check | Result | Evidence |
|-------|--------|----------|
| `git diff` syndication tree | **PASS** | 0 lines changed on `components/dashboard/syndication/`, `syndicationApi.js`, `platform-syndication.js` |
| Nav still includes Platform Syndication | **PASS** | `dashboardNavConfig.js` unchanged entry |
| Manual create → generate → publish | **PENDING** | Requires authenticated manual smoke on staging |

---

## Contract alignment checklist

| API | Client method | Aligned |
|-----|---------------|---------|
| `GET /platform/newsdesk/jobs` | `newsDeskApi.listJobs` | Yes |
| `GET /platform/newsdesk/jobs/:id/snapshot` | `newsDeskApi.getSnapshot` | Yes |
| `POST /platform/syndication/jobs` (V2) | `newsDeskApi.createSubmission` | Yes |
| `GET /platform/syndication/jobs/:id/pipeline` | `newsDeskApi.getPipeline` | Yes |
| `GET /platform/syndication/jobs/:id/facts` | `newsDeskApi.getFacts` | Yes |
| `POST …/pipeline/retry-extraction` | `newsDeskApi.retryExtraction` | Yes |

---

## Failed tests

None in automated scope.

---

## Passed tests (summary)

- All `npm run test:newsdesk` cases (8).
- `npm run build`.
- Static contract and snapshot-integrity review.
- Legacy syndication files untouched.
- Intake payload / duplicate-submit / polling logic (code + unit tests).

---

## Pending manual tests (staging checklist)

Use a **NEWS_DESK** (or **NEWS_DESK_ADMIN**) account on an environment with `NEWS_DESK_PIPELINE_V2=true` and News Desk routes deployed.

1. **UI** — Capture screenshots of dashboard, create, list, detail (pending + succeeded).
2. **Intake** — Submit article with 3 images; confirm snapshot `imageRefs.urls` order matches UI.
3. **Extraction** — Wait for `EXTRACTION_SUCCEEDED`; verify facts panel; optionally force failure and retry.
4. **List** — Exercise each filter + pagination; confirm empty state with impossible search.
5. **Security** — Reporter/Tenant role: no nav or access gate denial; API 403 on direct call.
6. **Syndication** — Full legacy job flow unchanged on same environment.

---

## Final commit recommendation

**Proceed with git commit** of News Desk V1 frontend changes when product approves, **after**:

1. Backend News Desk V1 deployed to target staging.
2. Manual checklist above completed once.
3. Confirm production API returns 401/403 (not 404) for desk routes before admin deploy.

Do **not** deploy admin to production until backend V1 is live and manual Tests 1–3 pass.

---

## Files touched during QA and pre-commit fixes

- `lib/syndication/platformRoles.js` — `canAccessNewsDesk`, `BACKEND_SYNDICATION_DESK_ROLES`
- `components/dashboard/newsDesk/NewsDeskAccessGate.jsx`, `NewsDeskDashboardView.jsx`, `NewsDeskFilters.jsx`, `NewsDeskDetailView.jsx`, `NewsDeskFactsPanel.jsx`
- `components/dashboard/dashboardNavConfig.js` — News Desk nav roles
- `lib/newsDesk/dashboardRefresh.js`, `extractionPolling.js`, `listQuery.js`, `apiErrors.js`, `useFactsPolling.js`
- `lib/api/services/newsDeskApi.js`
- `lib/newsDesk/__tests__/*.test.mjs` (8 tests total)