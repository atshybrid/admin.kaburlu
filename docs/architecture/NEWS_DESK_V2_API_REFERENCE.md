# News Desk V2 — Frontend API reference

**Canonical sample JSON (flows A–D, errors):**  
Backend repo: `kaburlu_media_backend/docs/architecture/NEWS_DESK_V2_API_SAMPLES.json`

**Postman (this repo):** [NEWS_DESK_W2_POSTMAN_EXAMPLES.json](./NEWS_DESK_W2_POSTMAN_EXAMPLES.json) — includes analytics + `staff/me`.

**Team handoff (WhatsApp + Cursor medium prompt):** [docs/frontend/NEWS_DESK_TEAM_HANDOFF.md](../frontend/NEWS_DESK_TEAM_HANDOFF.md)

**Cursor / AI prompt (full checklists + JSON):** [docs/frontend/NEWS_DESK_ADMIN_FRONTEND_PROMPT.md](../frontend/NEWS_DESK_ADMIN_FRONTEND_PROMPT.md)

**Admin implementation map**

| Flow step | API | Frontend |
|-----------|-----|----------|
| A.1 Source preview | `POST /platform/syndication/source-preview` | Create → **Preview source** (`newsDeskApi.previewSource`) |
| A.2 Upload images | `POST /media/upload` (BFF `/api/admin/media/upload`) | `NewsDeskImageUploader` → `images[]` on create |
| A.3 V2 intake | `POST /platform/syndication/jobs` + `options.newsDeskPipelineV2: true` | `buildNewsDeskIntakePayload` |
| A.4 Poll facts | `GET …/jobs/:id/facts` | `useFactsPolling` on detail |
| A.5 Snapshot | `GET /platform/newsdesk/jobs/:id/snapshot` | `NewsDeskOriginalPanel` (not `job.rawText`) |
| B List | `GET /platform/newsdesk/jobs` | Dashboard table + filters |
| B KPI | `GET /platform/newsdesk/analytics` | Dashboard stat cards |
| B scope | `GET /platform/newsdesk/staff/me` | Create — tenant lock / defaults |
| C Retry | `POST …/pipeline/retry-extraction` | Detail **Retry extraction** |
| D Parallel | snapshot + pipeline + facts | `NewsDeskDetailView` `loadAll` |

**V2 gate:** server `NEWS_DESK_PIPELINE_V2=true` and body `options.newsDeskPipelineV2: true`.

**Location hint shape (snapshot):** `{ district, mandal, area }` — create form fields match flow A sample.

**Legacy:** `/admin/platform-syndication?legacy=1` for old generate/publish; V2 jobs block generate/publish on API.