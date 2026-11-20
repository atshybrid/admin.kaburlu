# News Desk V2 — Frontend API reference

**Canonical sample JSON (flows A–D, errors):**  
Backend repo: `kaburlu_media_backend/docs/architecture/NEWS_DESK_V2_API_SAMPLES.json`

**Admin implementation map**

| Flow step | API | Frontend |
|-----------|-----|----------|
| A.1 Source preview | `POST /platform/syndication/source-preview` | Create → **Preview source** (`newsDeskApi.previewSource`) |
| A.2 Upload images | `POST /media/upload` (BFF `/api/admin/media/upload`) | `NewsDeskImageUploader` → `images[]` on create |
| A.3 V2 intake | `POST /platform/syndication/jobs` + `options.newsDeskPipelineV2: true` | `buildNewsDeskIntakePayload` |
| A.4 Poll facts | `GET …/jobs/:id/facts` | `useFactsPolling` on detail |
| A.5 Snapshot | `GET /platform/newsdesk/jobs/:id/snapshot` | `NewsDeskOriginalPanel` (not `job.rawText`) |
| B List | `GET /platform/newsdesk/jobs` | Dashboard table + filters |
| C Retry | `POST …/pipeline/retry-extraction` | Detail **Retry extraction** |
| D Parallel | snapshot + pipeline + facts | `NewsDeskDetailView` `loadAll` |

**V2 gate:** server `NEWS_DESK_PIPELINE_V2=true` and body `options.newsDeskPipelineV2: true`.

**Location hint shape (snapshot):** `{ district, mandal, area }` — create form fields match flow A sample.

**Legacy:** `/admin/platform-syndication?legacy=1` for old generate/publish; V2 jobs block generate/publish on API.