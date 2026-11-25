# News Desk — Frontend team handoff (copy-paste)

Share this file with **admin.kaburlu** developers or paste sections into **Cursor** when integrating or fixing News Desk.

---

## WhatsApp / ticket (Telugu + short)

```
News Desk admin — API integration

Base: NEXT_PUBLIC_BACKEND_URL = https://api.kaburlumedia.com/api/v1
Auth: Authorization: Bearer <login JWT>

Dashboard:
  GET /platform/newsdesk/jobs?page&pageSize&extractionStatus&pipelineStatus&q...
  GET /platform/newsdesk/analytics  → KPI cards
  GET /platform/newsdesk/staff/me  → create form tenant lock

Create:
  POST /platform/syndication/jobs
  body.options.newsDeskPipelineV2 = true
  images[] = URLs from POST /media/upload

Detail (parallel):
  GET /platform/newsdesk/jobs/:id/snapshot  → original (articleText)
  GET /platform/syndication/jobs/:id/pipeline
  GET /platform/syndication/jobs/:id/facts  → poll 5–10s
  POST /platform/syndication/jobs/:id/pipeline/retry-extraction

Errors:
  404 on /newsdesk/* → wrong BACKEND_URL or old API (not token)
  403 code SYNDICATION_ACCESS_DISABLED → operator disabled in staff settings

Full JSON samples: kaburlu_media_backend/docs/architecture/NEWS_DESK_V2_API_SAMPLES.json
Postman: admin.kaburlu/docs/architecture/NEWS_DESK_W2_POSTMAN_EXAMPLES.json
Spec: docs/frontend/NEWS_DESK_ADMIN_FRONTEND_PROMPT.md (admin repo same file)
```

---

## Cursor prompt (medium)

```
You work on admin.kaburlu News Desk (/admin/news-desk).

Environment:
- NEXT_PUBLIC_BACKEND_URL=https://api.kaburlumedia.com/api/v1 (prod)
- All calls: Authorization: Bearer <JWT>, Content-Type: application/json

Implement / fix using these APIs only (no mock):

1) Dashboard mount (parallel):
   - GET /platform/newsdesk/jobs?page=1&pageSize=20&sort=createdAt&order=desc
     Response: { success, total, page, pageSize, items[] }
     Each item: jobId, headline, categoryName, pipelineStatus, extractionStatus,
     articlePreview, acceptedAt, targetTenants[{ tenantId, nativeName, published, reviewStatus }]
   - GET /platform/newsdesk/analytics
     Response: { success, analytics: { pipelineTotal, extraction: { pendingApprox, factsSucceeded, queueDead }, ... } }
   Map KPI cards from analytics; fallback to list counts if analytics fails.

2) Create intake:
   - Optional GET /platform/newsdesk/staff/me → allowedTenantIds, lockTenantSelection
   - POST /media/upload multipart "file" → publicUrl
   - POST /platform/syndication/jobs with:
     rawText, headline?, category.categoryId, images[], sourceUrl?, locationHint?,
     tenants[] (publisher targets, can be []),
     options: { newsDeskPipelineV2: true, languageCode: "te" }
   Expect 201 + job.jobId + pipeline.status EXTRACTION_PENDING

3) Detail page jobId:
   - GET /platform/newsdesk/jobs/:id/snapshot → show articleText (immutable, not job.rawText)
   - GET /platform/syndication/jobs/:id/pipeline
   - GET /platform/syndication/jobs/:id/facts — poll until extractionStatus is SUCCEEDED or FAILED
   - Retry: POST /platform/syndication/jobs/:id/pipeline/retry-extraction (empty body)

4) Error UX:
   - 404 on GET /platform/newsdesk/jobs → "News Desk API not on this backend"
   - 401/403 → login or role; 403 code SYNDICATION_ACCESS_DISABLED → friendly Telugu message

Do NOT use legacy POST .../generate or .../publish for V2 pipeline jobs.

Reference JSON: kaburlu_media_backend/docs/architecture/NEWS_DESK_V2_API_SAMPLES.json
```

For the **full** spec (publish W3, staff/routing, error codes), attach or open:

**`docs/frontend/NEWS_DESK_ADMIN_FRONTEND_PROMPT.md`**

---

## Files to use

| File | Purpose |
|------|---------|
| [NEWS_DESK_ADMIN_FRONTEND_PROMPT.md](./NEWS_DESK_ADMIN_FRONTEND_PROMPT.md) | Full spec + JSON examples |
| [../architecture/NEWS_DESK_V2_API_REFERENCE.md](../architecture/NEWS_DESK_V2_API_REFERENCE.md) | Endpoint → UI map |
| [../architecture/NEWS_DESK_W2_POSTMAN_EXAMPLES.json](../architecture/NEWS_DESK_W2_POSTMAN_EXAMPLES.json) | Postman collection |
| `kaburlu_media_backend/docs/architecture/NEWS_DESK_V2_API_SAMPLES.json` | Canonical request/response bodies (backend repo) |

### Code entry points (admin)

| Area | Path |
|------|------|
| API client | `lib/api/services/newsDeskApi.js` |
| Dashboard | `components/dashboard/newsDesk/NewsDeskDashboardView.jsx` |
| Create | `components/dashboard/newsDesk/NewsDeskCreateView.jsx` |
| Detail | `components/dashboard/newsDesk/NewsDeskDetailView.jsx` |
| Operator tenants | `lib/newsDesk/operatorTenants.js` |

---

## గమనిక (Telugu)

- **`tenants[]`** = ఏ **పేపర్లకు** publish (publisher targets); intake లో employee pick కాదు.
- **Employee / operator scope** = `GET /platform/newsdesk/staff/me` + Settings → Staff (`/platform/newsdesk/staff`).
- Field **reporters** ↔ tenant = `POST /tenants/:tenantId/reporters` (Users admin) — News Desk intake API కాదు.

---

## One-liner (Cursor)

```
Wire admin News Desk to Kaburlu API: NEXT_PUBLIC_BACKEND_URL=/api/v1, JWT Bearer. Dashboard: GET /platform/newsdesk/jobs and /platform/newsdesk/analytics. Submit POST /platform/syndication/jobs with options.newsDeskPipelineV2:true. Detail: GET .../snapshot, .../pipeline, .../facts; poll facts until EXTRACTION_SUCCEEDED|FAILED; retry POST .../retry-extraction. Treat 404 on newsdesk as missing route. See docs/frontend/NEWS_DESK_ADMIN_FRONTEND_PROMPT.md and NEWS_DESK_V2_API_SAMPLES.json.
```