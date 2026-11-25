# Admin API Integration Matrix

**Base URL:** `{BACKEND}/api/v1` (local: `http://localhost:3011/api/v1`)  
**Admin client:** `lib/api/client.js` → browser uses `/api/proxy`

Legend: **Y** integrated · **P** partial · **—** no admin UI · **N** not wired

## Core platform

| Service file | Backend prefix | Admin surface | Status |
|--------------|----------------|---------------|--------|
| `newsDeskApi.js` | `/platform/newsdesk` | `/admin/news-desk/*` | **Y** |
| `syndicationApi.js` | `/platform/syndication` | `/admin/platform-syndication` | **P** (legacy generate/publish; V2 web via newsdesk) |
| `newsCartoonsApi.js` | news cartoons platform | `/admin/news-cartoons` | **Y** |
| `newsBannersApi.js` | news banners admin | `/admin/news-banners` | **Y** |
| `newsSurveysApi.js` | news survey routes | `/admin/news-surveys` | **Y** |
| `platformBillingApi.js` | platform billing admin | `/admin/tenant-wallets`, billing | **Y** |
| `tenantWalletApi.js` | tenant wallet | tenant wallet flows | **Y** |
| `readersAdminApi.js` | `/readers` | `/admin/readers` | **Y** |
| `politicalPartiesApi.js` | `/political-parties` | `/admin/political-parties` | **Y** |
| `iprEmpanelmentApi.js` | ipr empanelment | `/admin/ipr-empanelment` | **Y** |
| `reporterInsightsApi.js` | `/tenant-reporter-insights` | `/admin/reporter-insights` | **Y** |

## News Desk endpoint map

| Method | Path | Admin caller | UI |
|--------|------|--------------|-----|
| GET | `/platform/newsdesk/jobs` | `newsDeskApi.listJobs` | List + filters |
| GET | `/platform/newsdesk/jobs/:id/snapshot` | `getSnapshot` | Detail original |
| GET | `/platform/newsdesk/jobs/:id/tenant-outcomes` | `getTenantOutcomes` | Detail tenants |
| PATCH | `/platform/newsdesk/jobs/:id/tenants/:tid/review` | `patchTenantReview` | Review panel |
| GET | `/platform/newsdesk/jobs/:id/publish-capabilities` | `getPublishCapabilities` | Publish bar |
| POST | `/platform/newsdesk/jobs/:id/publish-web` | `publishWebV2` | Publish bar (`requireApproval`; no `skipApproval` from UI) |
| POST | `/platform/newsdesk/jobs/:id/tenants/:tid/publish-web` | `publishWebV2Tenant` | Tenant table |
| GET | `/platform/newsdesk/locations/search` | `searchLocations` | Location panel |
| GET | `/platform/newsdesk/jobs/:id/location` | `getApprovedLocation` | Location panel |
| POST | `/platform/newsdesk/jobs/:id/location/approve` | `approveLocation` | Location panel |
| GET | `/platform/newsdesk/analytics` | `getAnalytics` | Settings |
| GET | `/platform/newsdesk/staff/*` | staff APIs | Settings team |
| GET | `/platform/newsdesk/routing-rules` | routing APIs | Settings routing |
| GET | `/platform/newsdesk/published-articles` | `listPublishedArticles` | Settings |
| GET | `/platform/newsdesk/staff/me` | `getOperatorScope` | Create tenant scope |
| POST | `/platform/syndication/jobs` | `createSubmission` | Create intake |
| GET | `/platform/syndication/jobs/:id/pipeline` | `getPipeline` | Detail |
| GET | `/platform/syndication/jobs/:id/facts` | `getFacts` | Detail |
| POST | `/platform/syndication/jobs/:id/pipeline/retry-extraction` | `retryExtraction` | Detail |
| POST | `/platform/syndication/jobs/:id/generate` | `syndicationApi.generateJob` | Legacy desk only |
| POST | `/platform/syndication/jobs/:id/publish` | `syndicationApi.publishJob` | Legacy only; **409** `V2_USE_PUBLISH_WEB` if pipeline exists |

## Content & tenants

| Service file | Backend prefix | Admin surface | Status |
|--------------|----------------|---------------|--------|
| `articleService.js` | `/articles`, unified | `/admin/articles` | **Y** |
| `tenants.js` + `tenantApi.js` | `/tenants`, `/domains` | `/admin/tenants/*` | **Y** |
| `categoriesService` (index) | `/categories` | `/admin/categories` | **Y** |
| `languagesService` (index) | `/languages` | `/admin/languages` | **Y** |
| `locations.js` | `/locations`, districts, mandals | `/admin/locations/*` | **Y** |
| `users.js` | `/users` | `/admin/users` | **Y** |
| `rolesService` (index) | `/roles` | `/admin/roles` | **Y** |

## Journalist / union

| Service file | Backend prefix | Admin surface | Status |
|--------------|----------------|---------------|--------|
| `journalistApi.js` | `/journalist/*` | `/admin/journalist-union` | **Y** |
| `unionSurveysApi.js` | survey admin routes | `/admin/union-surveys` | **P** (fallback URLs) |
| `unionAdminApi.js` | union admin ops | journalist union tabs | **Y** |

## ePaper

| Service file | Backend prefix | Admin surface | Status |
|--------------|----------------|---------------|--------|
| `epaperApi.js`, `epaperService.js`, `epaperAdminApi.js` | `/epaper/*` | `/admin/epaper/*` | **Y** (large) |
| `smartDesignApi.js` | epaper smart design | designer integrations | **P** |

## Media

| Service file | Backend prefix | Admin surface | Status |
|--------------|----------------|---------------|--------|
| `mediaApi.js` | `/media` | uploads across forms | **Y** |
| BFF | `/api/admin/media/upload` | image uploaders | **Y** |

## Not wired to dedicated admin pages

| Backend area | Notes |
|--------------|-------|
| `/ai-desk/*` | No top-level admin route |
| `/secureMessages/*` | Mobile product |
| `/devices` | Mobile |
| Most `/public/*` | Consumer sites |
| `whatsapp.routes.ts` | Ops/config scattered |

---

## Auth headers

All integrated services use `apiClient.getAuthHeaders()` → `Bearer` JWT from `utils/auth`.

## Proxy path normalization

`pages/api/proxy/[...path].js` strips duplicate `/api/v1` — callers should use paths like `/platform/newsdesk/jobs` (no double prefix).