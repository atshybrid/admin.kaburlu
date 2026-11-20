# News Desk V1 — Frontend delivery report

**Status:** Implemented in `admin.kaburlu` (not deployed to production).

## Routes

| Path | Purpose |
|------|---------|
| `/admin/news-desk` | Dashboard + filtered list |
| `/admin/news-desk/create` | V2 intake form |
| `/admin/news-desk/[jobId]` | Snapshot + pipeline + facts + retry |

## API client (`lib/api/services/newsDeskApi.js`)

| Method | Endpoint |
|--------|----------|
| `listJobs` | `GET /platform/newsdesk/jobs` |
| `getSnapshot` | `GET /platform/newsdesk/jobs/:id/snapshot` |
| `createSubmission` | `POST /platform/syndication/jobs` (`options.newsDeskPipelineV2: true`) |
| `getPipeline` | `GET /platform/syndication/jobs/:id/pipeline` |
| `getFacts` | `GET /platform/syndication/jobs/:id/facts` |
| `retryExtraction` | `POST /platform/syndication/jobs/:id/pipeline/retry-extraction` |

Upload: `lib/api/services/mediaApi.js` → BFF `/api/admin/media/upload` (folder `news-desk`).

## Dashboard metrics

Counts use **four** list API calls with `pageSize=1` and `total` from the server (`EXTRACTION_PENDING`, `EXTRACTION_SUCCEEDED`, `EXTRACTION_FAILED`, and unfiltered total). They are **not** derived from the current table page.

## Tests

```bash
npm run test:newsdesk
```

## Changed / added files

**Pages**

- `pages/admin/news-desk/index.js`
- `pages/admin/news-desk/create.js`
- `pages/admin/news-desk/[jobId].js`

**Components**

- `components/dashboard/newsDesk/*` (Access gate, dashboard, create, detail, filters, table, panels, image uploader)

**Lib**

- `lib/api/services/newsDeskApi.js`
- `lib/newsDesk/buildIntakePayload.js`
- `lib/newsDesk/categoryLoader.js`
- `lib/newsDesk/statusBadges.js`
- `lib/newsDesk/useFactsPolling.js`
- `lib/newsDesk/__tests__/buildIntakePayload.test.mjs`

**Nav / access**

- `components/dashboard/dashboardNavConfig.js` (News Desk link)
- `lib/platformDesk.js` (`PLATFORM_DESK_ROUTES`)

**Tooling**

- `package.json` — `test:newsdesk` script

## Not modified (legacy preserved)

- `components/dashboard/syndication/*`
- `pages/admin/platform-syndication.js`
- `lib/api/services/syndicationApi.js`

## Local preview

```bash
npm run dev
```

Open `http://localhost:3000/admin/news-desk` with a desk-role JWT in local auth storage.