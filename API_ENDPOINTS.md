# Complete API Endpoints List

**Base URL:** `https://app.kaburlumedia.com/api/v1`

**Authentication:** All requests require `Authorization: Bearer {JWT_TOKEN}` header

---

## 1. AUTHENTICATION APIs

### Login
```
POST /auth/login
Body: { email, password, mpin }
Response: { token, user, loginResponse }
```

### Logout
```
POST /auth/logout
```

### Refresh Token
```
POST /auth/refresh
```

---

## 2. TENANTS APIs

### List All Tenants
```
GET /tenants?full=true
Response: Array of tenant objects with entity, domains, categories
```

### Get Single Tenant
```
GET /tenants/{tenantId}
Response: Tenant object with full details
```

### Create Tenant (SUPER_ADMIN)
```
POST /tenants
Body: { name, slug, stateId, prgiNumber, ... }
```

### Update Tenant (SUPER_ADMIN)
```
PATCH /tenants/{tenantId}
Body: { name, slug, ... }
```

---

## 3. TENANT ENTITY (PRGI/Publisher) APIs

### Get Entity Details
```
GET /tenants/{tenantId}/entity
Response: Publisher/PRGI registration details
```

### Create/Update Entity
```
POST /tenants/{tenantId}/entity
Body: { businessName, address, prgiDetails, ... }
```

### Create Simple Entity
```
POST /tenants/{tenantId}/entity/simple
Body: { nativeName, businessName }
```

### Update Entity
```
PUT /tenants/{tenantId}/entity
Body: { ... }
```

### Update Business Info
```
PUT /tenants/{tenantId}/entity/business
Body: { businessName, ... }
```

### Update Native Name
```
PATCH /tenants/{tenantId}/entity/native-name
Body: { nativeName }
```

---

## 4. DOMAINS APIs

### List All Domains
```
GET /domains
Response: Array of all domains in system
```

### Create Domain for Tenant
```
POST /tenants/{tenantId}/domains
Body: { name, kind }
```

### Verify Domain (SUPER_ADMIN)
```
POST /domains/{domainId}/verify
Body: { method: 'MANUAL', force: false }
```

### Set Domain Kind
```
PATCH /domains/{domainId}/kind
Body: { kind: 'NEWSPAPER' | 'WEB' }
```

### Set Domain Categories
```
PUT /domains/{domainId}/categories
Body: { categoryIds: [...] }
```

### Delete Domain
```
DELETE /tenants/{tenantId}/domains/{domainId}
```

---

## 5. CATEGORIES APIs

### Get Tenant Categories
```
GET /tenants/{tenantId}/categories?includeTranslation=true&domainId={domainId}
Response: Array of categories with translations
```

### Get All Categories (Global)
```
GET /categories
Response: All categories in system
```

---

## 6. LANGUAGES APIs

### Get Tenant Languages
```
GET /tenants/{tenantId}/languages
Response: Array of language objects
```

---

## 7. ARTICLES APIs

### Create Article
```
POST /tenants/{tenantId}/articles
Body: {
  title, content, summary, categoryId, 
  languageCode, tags, imageUrl, status
}
```

### List Articles
```
GET /tenants/{tenantId}/articles?page=1&limit=20&status=PUBLISHED&categoryId={id}
Response: { items: [...], total, page, limit }
```

### Get Single Article
```
GET /tenants/{tenantId}/articles/{articleId}
Response: Article object
```

### Update Article
```
PATCH /tenants/{tenantId}/articles/{articleId}
Body: { title, content, ... }
```

### Delete Article
```
DELETE /tenants/{tenantId}/articles/{articleId}
```

### Get Unified Articles (All Types)
```
GET /articles/unified?tenantId={id}&type=all&status=PUBLISHED&fromDate=2024-01-01&toDate=2024-01-31&page=1&limit=20&sortBy=createdAt&sortOrder=desc
Response: {
  newspaper: { items: [...], total },
  web: { items: [...], total },
  shortNews: { items: [...], total }
}
```

### Create Unified Article
```
POST /articles/unified
Body: {
  tenantId,
  baseArticle: { languageCode, category: {...}, location: {...} },
  printArticle: { headline, body: [...], dateline, ... },
  webArticle: { headline, body: [...], ... },
  shortNews: { headline, body: [...], ... },
  mediaRequirements: [...]
}
```

---

## 8. AI ARTICLE APIs

### AI Rewrite (Process Raw Text)
```
POST /ai/rewrite/unified
Body: { rawText, tenantId, languageCode }
Response: {
  structured: {
    headline, body: [...], summary, dateline,
    category, location, tags, mediaRequirements
  },
  completionPercentage,
  aiConfidence
}
```

---

## 9. LOCATION APIs

### Search Locations
```
POST /location/search
Body: { q: "హైదరాబాద్", lang: "te", tenantId }
Response: Array of location matches
```

### Search Combined (GET)
```
GET /locations/search-combined?q={query}&tenantId={id}&limit=20
Response: {
  items: [{
    village: {...}, mandal: {...}, 
    district: {...}, state: {...}
  }]
}
```

### Get States
```
GET /locations/states
```

### Get Districts
```
GET /locations/districts?stateId={id}
```

### Get Assembly Constituencies
```
GET /locations/constituencies?districtId={id}
```

### Get Mandals
```
GET /locations/mandals?districtId={id}
```

---

## 10. MEDIA UPLOAD APIs

### Upload Media (Image/Video)
```
POST /media/upload
Content-Type: multipart/form-data
Body FormData: {
  file: File,
  key: "alt-text",
  filename: "caption-telugu",
  folder: "articles",
  kind: "image" | "video"
}
Response: {
  publicUrl, key, name, contentType, size, kind
}
```

---

## 11. USERS APIs

### List Users
```
GET /users?page=1&limit=20&role=REPORTER&tenantId={id}
```

### Get User
```
GET /users/{userId}
```

### Create User
```
POST /users
Body: { email, name, role, tenantId, ... }
```

### Update User
```
PATCH /users/{userId}
Body: { name, role, ... }
```

### Delete User
```
DELETE /users/{userId}
```

---

## 12. ROLES APIs

### List Roles
```
GET /roles
Response: Array of role objects
```

### Get Role
```
GET /roles/{roleId}
```

---

## 13. SETTINGS APIs

### Entity Settings (SUPER_ADMIN)
```
GET /entity/settings
PUT /entity/settings
PATCH /entity/settings
```

### Tenant Settings
```
GET /tenants/{tenantId}/settings
PUT /tenants/{tenantId}/settings
PATCH /tenants/{tenantId}/settings
```

### Domain Settings
```
GET /tenants/{tenantId}/domains/{domainId}/settings
PUT /tenants/{tenantId}/domains/{domainId}/settings
PATCH /tenants/{tenantId}/domains/{domainId}/settings
```

---

## 14. EPAPER APIs

### List ePaper Issues
```
GET /epaper/issues/all-by-date?tenantId={id}&fromDate=2024-01-01&toDate=2024-01-31
```

### Get Issue by Date
```
GET /epaper/issues/by-date?tenantId={id}&date=2024-01-23&editionId={id}
```

### Upload ePaper
```
POST /epaper/issues
Body: { tenantId, editionId, publishDate, pages: [...] }
```

### List Editions
```
GET /tenants/{tenantId}/epaper/editions
```

### Create Edition
```
POST /tenants/{tenantId}/epaper/editions
Body: { name, code, isDefault }
```

---

## 15. RAZORPAY SETTINGS APIs

### Get Global Razorpay Settings
```
GET /razorpay/settings
```

### Update Global Razorpay
```
PATCH /razorpay/settings
Body: { keyId, keySecret, ... }
```

### Get Tenant Razorpay Settings
```
GET /tenants/{tenantId}/razorpay
```

### Update Tenant Razorpay
```
PATCH /tenants/{tenantId}/razorpay
Body: { enabled, keyId, ... }
```

---

## Environment Variables

```env
NEXT_PUBLIC_BACKEND_URL=https://app.kaburlumedia.com/api/v1
NEXT_PUBLIC_API_BASE=https://app.kaburlumedia.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Response Format

All API responses follow this structure:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
```

---

## Common Query Parameters

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `sortBy` - Sort field (default: 'createdAt')
- `sortOrder` - 'asc' or 'desc' (default: 'desc')
- `tenantId` - Filter by tenant
- `domainId` - Filter by domain
- `status` - Filter by status
- `fromDate` - Start date (YYYY-MM-DD)
- `toDate` - End date (YYYY-MM-DD)

---

## Notes

1. All endpoints use JWT Bearer token authentication
2. Direct backend calls (no proxy)
3. CORS must be configured on backend for frontend domain
4. Timestamps in ISO 8601 format (UTC)
5. Pagination starts from page 1
6. All POST/PUT/PATCH requests use JSON body
7. File uploads use multipart/form-data
