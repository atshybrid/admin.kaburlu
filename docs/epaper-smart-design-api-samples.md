# ePaper Smart Design API — sample requests & responses

**Swagger UI:** `/admin/epaper/api-docs`  
**OpenAPI JSON:** `/openapi/epaper-smart-design.openapi.json`  
**Admin BFF base:** `/api/admin/epaper/smart-design`  
**Backend target:** `/api/v1/epaper/smart-design`

**Headers (all tenant APIs):**

```http
Authorization: Bearer <jwt>
X-Tenant-Id: <tenant-uuid>
Content-Type: application/json
```

**Media upload (internal URL):**

```http
POST /api/admin/media/upload
Content-Type: multipart/form-data
```

Response → use `internalUrl` in smart design fields (`headerLogoUrl`, `subHeaderLogoUrl`, etc.).

---

## Summary table

| # | Method | Path | Success |
|---|--------|------|---------|
| 1 | **GET** | `/epaper/smart-design/header-styles` | `200` → `{ source, mainHeaders[], subHeaders[] }` |
| 2 | **GET** | `/admin/epaper/header-styles` | `200` same catalog (legacy admin route) |
| 3 | **GET** | `/epaper/smart-design/context` | `200` → tenant, PRGI, domain, editions, headerStyles |
| 4 | **GET** | `/epaper/smart-design` | `200` → `{ tenantId, total, items[] }` |
| 5 | **GET** | `/epaper/smart-design/{id}` | `200` → `{ design, prgiNumber, epaperDomain }` |
| 6 | **POST** | `/epaper/smart-design` | `201` → `{ success, design, prgiNumber, epaperDomain }` |
| 7 | **PUT** | `/epaper/smart-design/{id}` | `200` → `{ success, design }` |
| 8 | **PATCH** | `/epaper/smart-design/{id}` | `200` → `{ success, design }` |
| 9 | **DELETE** | `/epaper/smart-design/{id}` | `200` → `{ success, id, message }` |

---

## 1. GET header-styles

```http
GET /api/admin/epaper/smart-design/header-styles
```

**200**

```json
{
  "source": "headerStyleCatalog",
  "mainHeaders": [
    { "number": 1, "key": "main_style1", "slug": "classic_3_col_info_bar", "name": "Classic 3-Col + Info Bar", "nameTe": "క్లాసిక్ 3-కాలమ్ + సమాచార పట్టీ" },
    { "number": 2, "key": "main_style2", "slug": "prabha_3_col_meta_strip", "name": "Prabha 3-Col + Meta Strip", "nameTe": "ప్రభా 3-కాలమ్ + మెటా స్ట్రిప్" }
  ],
  "subHeaders": [
    { "number": 1, "key": "sub_header_style1", "slug": "page_logo_date", "name": "Page · Logo · Date", "nameTe": "పేజీ · లోగో · తేదీ" }
  ],
  "designConfigFields": [
    { "field": "headerStyleNumber", "type": "number", "scope": "tenant|edition" }
  ]
}
```

---

## 2. GET context (tenant-wise)

```http
GET /api/admin/epaper/smart-design/context?editionId=ed_telangana&subEditionId=
X-Tenant-Id: tenant_abc
```

**200**

```json
{
  "tenant": { "id": "tenant_abc", "name": "Telugu Daily" },
  "prgiNumber": "TELENG/2024/12345",
  "epaperDomain": "epaper.telugudaily.com",
  "editions": [],
  "headerStyles": {
    "source": "headerStyleCatalog",
    "mainHeaders": [],
    "subHeaders": []
  },
  "activeDesign": {
    "id": "clsd_main_tg",
    "publicationEditionId": "ed_telangana",
    "headerStyleKey": "main_style2",
    "subHeaderStyleKey": "sub_header_style1",
    "headerLogoUrl": "https://cdn/internal/logo.png",
    "today": {
      "issueDate": "2026-05-28",
      "dayNameTelugu": "బుధవారం",
      "currentVolume": 3,
      "currentIssue": 148,
      "maxIssuePerYear": 365
    }
  },
  "totalDesigns": 1
}
```

---

## 3. GET list

```http
GET /api/admin/epaper/smart-design?publicationEditionId=ed_telangana
X-Tenant-Id: tenant_abc
```

**200**

```json
{
  "tenantId": "tenant_abc",
  "total": 1,
  "items": [
    {
      "id": "clsd_xyz789",
      "publicationEditionId": "ed_telangana",
      "pageSize": "TABLOID",
      "totalPages": 12,
      "paperSellCost": 6,
      "headerStyleNumber": 2,
      "subHeaderStyleNumber": 1,
      "headerStyleKey": "main_style2",
      "subHeaderStyleKey": "sub_header_style1"
    }
  ]
}
```

---

## 4. GET by id

```http
GET /api/admin/epaper/smart-design/clsd_xyz789
X-Tenant-Id: tenant_abc
```

**200**

```json
{
  "design": {
    "id": "clsd_xyz789",
    "publicationEditionId": "ed_telangana",
    "totalPages": 12,
    "paperSellCost": 6,
    "headerStyleKey": "main_style2",
    "headerLogoUrl": "https://cdn/internal/logo.png",
    "subHeaderLogoUrl": "https://cdn/internal/sub-logo.png",
    "today": {
      "issueDate": "2026-05-28",
      "dayNameTelugu": "బుధవారం",
      "currentVolume": 3,
      "currentIssue": 148,
      "maxIssuePerYear": 365
    }
  },
  "prgiNumber": "TELENG/2024/12345",
  "epaperDomain": "epaper.telugudaily.com"
}
```

---

## 5. POST create

**Request**

```json
{
  "publicationEditionId": "ed_telangana",
  "subEditionId": null,
  "pageSize": "TABLOID",
  "totalPages": 12,
  "perPagePrice": 0,
  "paperSellCost": 6,
  "headerStyleNumber": 2,
  "subHeaderStyleNumber": 1,
  "headerLogoUrl": "https://cdn/internal/tenant/logo.png",
  "subHeaderLogoUrl": "https://cdn/internal/tenant/sub-logo.png",
  "paperNameImageUrl": "https://cdn/internal/tenant/masthead.png",
  "headerLeftImageUrl": "https://cdn/internal/tenant/left-ad.png",
  "headerRightImageUrl": "https://cdn/internal/tenant/right-thumb.png",
  "publishedAreaText": "Hyderabad • Guntur • Kurnool",
  "tagline": "మన భాష.. మన పత్రిక",
  "websiteUrl": "www.telugudaily.com",
  "runningCommentText": "లైన్1\nలైన్2",
  "runningCommentAuthor": "- రచయిత",
  "rightArticleTitle": "శీర్షిక",
  "rightArticlePoints": "బులెట్1\nబులెట్2",
  "today": {
    "issueDate": "2026-05-28",
    "currentVolume": 3,
    "currentIssue": 148,
    "maxIssuePerYear": 365
  }
}
```

**201**

```json
{
  "success": true,
  "prgiNumber": "TELENG/2024/12345",
  "epaperDomain": "epaper.telugudaily.com",
  "design": {
    "id": "clsd_xyz789",
    "publicationEditionId": "ed_telangana",
    "totalPages": 12,
    "paperSellCost": 6,
    "headerStyleKey": "main_style2",
    "subHeaderStyleKey": "sub_header_style1",
    "today": {
      "issueDate": "2026-05-28",
      "dayNameTelugu": "బుధవారం",
      "currentVolume": 3,
      "currentIssue": 148,
      "maxIssuePerYear": 365
    }
  }
}
```

---

## 6. PUT replace

```http
PUT /api/admin/epaper/smart-design/clsd_xyz789
```

**Body:** full `SmartDesign` object (same shape as POST).

**200**

```json
{
  "success": true,
  "design": {
    "id": "clsd_xyz789",
    "paperSellCost": 7,
    "totalPages": 16,
    "updatedAt": "2026-05-28T15:00:00.000Z"
  }
}
```

---

## 7. PATCH partial

```json
{
  "paperSellCost": 8,
  "tagline": "New tagline only",
  "headerLogoUrl": "https://cdn/internal/new-logo.png"
}
```

**200**

```json
{
  "success": true,
  "design": {
    "id": "clsd_main_tg",
    "paperSellCost": 8,
    "tagline": "New tagline only",
    "today": { "currentVolume": 3, "currentIssue": 148 }
  }
}
```

---

## 8. DELETE

**200**

```json
{
  "success": true,
  "id": "clsd_main_tg",
  "message": "Smart design deleted"
}
```

---

## Common errors

| Status | Body |
|--------|------|
| `400` | `{ "error": "Tenant context required (X-Tenant-Id)" }` |
| `401` | `{ "error": "UNAUTHENTICATED" }` |
| `403` | `{ "error": "Admin access required" }` |
| `404` | `{ "error": "Smart design not found" }` |
| `409` | `{ "error": "Design already exists for this edition scope", "existingId": "clsd_xyz789" }` |

---

## Media upload → smart design flow

1. `POST /api/admin/media/upload` with `file` + folder `tenants/{tenantId}/epaper/design-config`
2. Read `internalUrl` from response
3. `PATCH /api/admin/epaper/smart-design/{id}` with `{ "headerLogoUrl": "<internalUrl>" }`

---

## React client

```js
import smartDesignApi from '@/lib/api/services/smartDesignApi'

const ctx = await smartDesignApi.getContext(tenantId, { editionId })
const { items } = await smartDesignApi.list(tenantId, { publicationEditionId: editionId })
await smartDesignApi.create(tenantId, payload)
await smartDesignApi.patch(tenantId, id, { headerLogoUrl: internalUrl })
```
