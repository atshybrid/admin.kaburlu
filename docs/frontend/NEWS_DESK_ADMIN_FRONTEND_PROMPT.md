# News Desk Admin — Frontend AI Prompt (copy-paste)

> **Use this entire block** in Cursor / admin.kaburlu repo chat when building or fixing **News Desk** UI.  
> Backend repo: `kaburlu_media_backend` — production has routes as of Nov 2025.

---

## Prompt (English — paste below this line)

You are integrating **Kaburlu News Desk (Syndication V2)** in the **Next.js admin** (`admin.kaburlumedia.com`).

### Base URL & auth

- Production: `NEXT_PUBLIC_BACKEND_URL=https://api.kaburlumedia.com/api/v1`
- Local: `http://localhost:3011/api/v1` (or `3001`)
- Every request:
  - `Authorization: Bearer <JWT from platform login>`
  - `Content-Type: application/json` (except `POST /media/upload`)

**Roles allowed:** `SUPER_ADMIN`, `SUPERADMIN`, `NEWS_DESK`, `NEWS_DESK_ADMIN`, `NEWS_MODERATOR`

**Detect “API not deployed”:** `GET /platform/newsdesk/jobs` returns **404** → show deploy message. **401/403** = auth/role issue, not missing API. **200** = OK.

---

### Admin dashboard (list + KPI cards)

#### 1) List submissions (primary — use this, not legacy syndication list)

`GET /platform/newsdesk/jobs`

| Query param | Values |
|-------------|--------|
| `page` | default `1` |
| `pageSize` | default `20`, max `50` |
| `q` | search headline / rawText (max 200 chars) |
| `pipelineStatus` | `NewsDeskPipelineStatus` e.g. `EXTRACTION_PENDING`, `EXTRACTION_SUCCEEDED` |
| `extractionStatus` | `EXTRACTION_PENDING` \| `EXTRACTION_SUCCEEDED` \| `EXTRACTION_FAILED` |
| `categoryId` | string |
| `fromDate`, `toDate` | ISO date → `createdAt` filter |
| `sort` | `createdAt` (default) \| `updatedAt` |
| `order` | `desc` (default) \| `asc` |

**Response 200:**

```json
{
  "success": true,
  "total": 42,
  "page": 1,
  "pageSize": 20,
  "items": [
    {
      "jobId": "cuid",
      "syndicationStatus": "DRAFT",
      "headline": "తెలుగు హెడ్‌లైన్",
      "categoryId": "cat-id",
      "categoryName": "Politics",
      "pipelineId": "pipe-id",
      "pipelineStatus": "EXTRACTION_PENDING",
      "extractionStatus": "EXTRACTION_PENDING",
      "sourceUrl": "https://...",
      "articlePreview": "First 160 chars of body…",
      "createdAt": "2026-11-25T00:00:00.000Z",
      "updatedAt": "2026-11-25T00:00:00.000Z",
      "acceptedAt": "2026-11-25T00:00:00.000Z",
      "targetTenants": [
        {
          "tenantId": "tenant-id",
          "nativeName": "పేపర్ పేరు",
          "published": false,
          "reviewStatus": null
        }
      ]
    }
  ]
}
```

**Note:** `pipelineId` / `pipelineStatus` can be `null` for orphan V2 jobs until backfill; then call syndication `GET .../facts` to trigger repair.

**Errors 400:** `INVALID_EXTRACTION_STATUS`, `INVALID_DATE`, `INVALID_DATE_RANGE`, `SEARCH_TOO_LONG`

#### 2) KPI / summary cards (dashboard top)

`GET /platform/newsdesk/analytics`

```json
{
  "success": true,
  "analytics": {
    "generatedAt": "2026-11-25T02:00:00.000Z",
    "pipelineTotal": 120,
    "pipelineByStatus": { "EXTRACTION_PENDING": 5, "EXTRACTION_SUCCEEDED": 80 },
    "jobsCreatedLast7Days": 12,
    "publishedSyndicationJobs": 30,
    "publishedWebArticleRows": 45,
    "staffWithSyndicationEnabled": 8,
    "extraction": {
      "pendingApprox": 5,
      "factsSucceeded": 80,
      "queueDead": 2
    }
  }
}
```

Map UI cards:

| Card | Field |
|------|--------|
| Total News | `pipelineTotal` or list `total` |
| Extraction pending | `extraction.pendingApprox` or filter list `extractionStatus=EXTRACTION_PENDING` |
| Facts ready | `extraction.factsSucceeded` or filter `EXTRACTION_SUCCEEDED` |
| Extraction failed | `extraction.queueDead` + failed pipeline status |

#### 3) Operator scope (intake tenant lock)

`GET /platform/newsdesk/staff/me`

```json
{
  "success": true,
  "syndicationAccess": true,
  "allowedTenantIds": ["tenant-a", "tenant-b"],
  "defaultIntakeTenantIds": ["tenant-a"],
  "lockTenantSelection": true,
  "roleName": "NEWS_DESK"
}
```

Empty `allowedTenantIds` = all tenants (admins). Use for default tenant pickers on submit.

---

### Submit new news (V2 intake)

`POST /platform/syndication/jobs`

**Required for V2:** `options.newsDeskPipelineV2: true` (server must have `NEWS_DESK_PIPELINE_V2=true` — enabled on prod).

```json
{
  "rawText": "పూర్తి వార్తా టెక్స్ట్ (5W)",
  "headline": "ఐచ్ఛిక హెడ్‌లైన్",
  "category": { "categoryId": "<from categories API>" },
  "images": ["https://cdn.../photo.webp"],
  "sourceUrl": "https://optional-source",
  "sourceAttribution": { "type": "DESK" },
  "locationHint": { "district": "Hyderabad", "area": "..." },
  "tenants": [],
  "options": { "newsDeskPipelineV2": true, "languageCode": "te" }
}
```

**201 response (short):**

```json
{
  "success": true,
  "status": "DRAFT",
  "job": { "jobId": "...", "status": "DRAFT", "..." },
  "pipeline": {
    "id": "...",
    "status": "EXTRACTION_PENDING",
    "headline": "...",
    "imageRefs": { "urls": ["..."], "mediaIds": [] },
    "acceptedAt": "..."
  }
}
```

**Images:** upload first via `POST /media/upload` (multipart `file`) → use `publicUrl` in `images[]`.

**Do not** use `POST .../generate` or legacy `publish` for V2 pipeline jobs — returns **409**.

**Legacy mistake:** V2 flag off → `TENANTS_REQUIRED` — fix backend env, not frontend only.

---

### Job detail page (read-only original + extraction)

Parallel fetches after `jobId` known:

| Section | API |
|---------|-----|
| Immutable body/headline/images/location | `GET /platform/newsdesk/jobs/:id/snapshot` |
| Pipeline status | `GET /platform/syndication/jobs/:id/pipeline` |
| Facts + extraction badge | `GET /platform/syndication/jobs/:id/facts` |
| Optional job shell | `GET /platform/syndication/jobs/:id` |

**Snapshot 200:**

```json
{
  "success": true,
  "jobId": "...",
  "pipelineId": "...",
  "snapshotId": "...",
  "snapshotVersion": 1,
  "headline": "...",
  "articleText": "ORIGINAL — never use PATCHed rawText alone",
  "imageRefs": { "urls": ["..."], "mediaIds": [] },
  "sourceUrl": null,
  "sourcePlatform": null,
  "sourceAttribution": { "type": "DESK" },
  "locationHint": { "district": "..." },
  "categoryId": "...",
  "acceptedAt": "...",
  "collectedById": "..."
}
```

**Facts 200 (success):**

```json
{
  "success": true,
  "jobId": "...",
  "pipelineId": "...",
  "extractionStatus": "EXTRACTION_SUCCEEDED",
  "factsVersion": 1,
  "promptKey": "newsdesk_fact_extract",
  "facts": {
    "category": "",
    "event": "",
    "persons": [],
    "organizations": [],
    "locations": [],
    "keyFacts": [],
    "datesAndNumbers": [],
    "sourceAttribution": "",
    "missingInformation": [],
    "sourceExcerpts": []
  },
  "failure": null,
  "queue": { "status": "SUCCEEDED", "attempts": 1, "maxAttempts": 3 }
}
```

**Poll facts** every 5–10s while `extractionStatus === "EXTRACTION_PENDING"`.

**Retry:** `POST /platform/syndication/jobs/:id/pipeline/retry-extraction` (empty body) → **200** `{ "success": true, "status": "EXTRACTION_PENDING" }`

**404:** `PIPELINE_NOT_FOUND`, `SNAPSHOT_NOT_FOUND`

---

### Publish / review (W3 — when UI adds buttons)

- `GET /platform/newsdesk/jobs/:id/publish-capabilities`
- `GET /platform/newsdesk/jobs/:id/publish-preview?tenantId=`
- `POST /platform/newsdesk/jobs/:id/publish-web` body: `{ "tenantIds": ["..."], "requireApproval": true }`
- `GET /platform/newsdesk/jobs/:id/tenant-outcomes`
- `PATCH /platform/newsdesk/jobs/:id/tenants/:tenantId/review` body: `{ "status": "APPROVED", "reviewNote": "" }`

---

### Staff / routing (admin only)

- `GET /platform/newsdesk/staff` — `NEWS_DESK_ADMIN` or `SUPER_ADMIN`
- `POST|PATCH /platform/newsdesk/staff/:userId`
- `GET|POST|PATCH /platform/newsdesk/routing-rules`

---

### Error handling (UI)

| HTTP | Meaning |
|------|---------|
| 401 | Missing/expired JWT — re-login |
| 403 | Wrong role or `SYNDICATION_ACCESS_DISABLED` |
| 404 on `/newsdesk/*` | Wrong `NEXT_PUBLIC_BACKEND_URL` or old API |
| 409 | Retry while in progress, or legacy generate blocked |
| 422 | Validation / insufficient data |
| 500 | Show generic error + support |

Standard error body:

```json
{ "success": false, "code": "RAW_TEXT_REQUIRED", "error": "rawText is required" }
```

---

### Implementation checklist for admin News Desk page

1. On mount: `GET /platform/newsdesk/jobs` + `GET /platform/newsdesk/analytics`
2. If list 404 → banner “Deploy News Desk V1 routes or fix BACKEND_URL”
3. Table columns: `headline`, `categoryName`, `extractionStatus`, `pipelineStatus`, `acceptedAt`, `targetTenants`
4. Row click → detail with `snapshot` + `facts`
5. Submit form → `POST /platform/syndication/jobs` with V2 options
6. No WebSocket — polling only for extraction

**Full JSON catalog:** backend `docs/architecture/NEWS_DESK_V2_API_SAMPLES.json`  
**Postman:** `docs/architecture/NEWS_DESK_W2_POSTMAN_EXAMPLES.json`

Build TypeScript types from the JSON above. Use Telugu labels in UI; API fields stay English.

---

## Telugu summary (ఫ్రంట్ టీమ్ కోసం)

- **లిస్ట్:** `GET /platform/newsdesk/jobs` — ఫిల్టర్స్, pagination, extraction status తో rows రావు.
- **కార్డులు:** `GET /platform/newsdesk/analytics` — pending/succeeded/failed counts.
- **సబ్మిట్:** `POST /platform/syndication/jobs` + `newsDeskPipelineV2: true`.
- **డిటైల్:** snapshot = original text; facts = AI extraction; pipeline = status.
- **404** అంటే API deploy లేదు లేదా wrong backend URL; **401** అంటే token problem.

---

## Cursor one-liner (short prompt)

```
Wire admin News Desk to Kaburlu API: NEXT_PUBLIC_BACKEND_URL=/api/v1, JWT Bearer. Dashboard: GET /platform/newsdesk/jobs and /platform/newsdesk/analytics. Submit POST /platform/syndication/jobs with options.newsDeskPipelineV2:true. Detail: GET .../snapshot, .../pipeline, .../facts; poll facts until EXTRACTION_SUCCEEDED|FAILED; retry POST .../retry-extraction. Treat 404 on newsdesk as missing route. See kaburlu_media_backend docs/frontend/NEWS_DESK_ADMIN_FRONTEND_PROMPT.md and NEWS_DESK_V2_API_SAMPLES.json for full request/response JSON.
```