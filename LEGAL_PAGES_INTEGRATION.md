# Legal Pages Management - Integration Guide

## Overview
The Legal Pages feature allows Super Admins to manage tenant legal/static pages like Privacy Policy, Terms of Service, About Us, Contact, and Refund Policy through the admin panel.

## Architecture

### Backend API Endpoints
**Base URL:** `https://api.kaburlumedia.com/api/v1`

#### Admin APIs (Require Bearer Token)

**1. List All Pages**
```
GET /api/v1/tenants/:tenantId/pages
```
Response:
```json
[
  {
    "slug": "privacy-policy",
    "title": "Privacy Policy",
    "contentHtml": "<h1>Privacy Policy</h1><p>...</p>",
    "meta": { "keywords": "privacy, data protection" },
    "published": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**2. Get Single Page**
```
GET /api/v1/tenants/:tenantId/pages/:slug
```
Example: `GET /api/v1/tenants/TENANT_ID/pages/privacy-policy`

**3. Create/Update Page (Upsert)**
```
PUT /api/v1/tenants/:tenantId/pages/:slug
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "title": "Privacy Policy",
  "contentHtml": "<h1>Privacy Policy</h1><p>Your content...</p>",
  "meta": { "keywords": "privacy, data protection" },
  "published": true
}
```

**4. Update Page (Partial)**
```
PATCH /api/v1/tenants/:tenantId/pages/:slug
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "published": false
}
```

**5. Delete Page**
```
DELETE /api/v1/tenants/:tenantId/pages/:slug
```

#### Public APIs (No Auth Required)
These routes use domain-based tenant resolution:

```
GET /api/v1/public/privacy-policy
GET /api/v1/public/terms-of-service
GET /api/v1/public/about-us
GET /api/v1/public/contact
GET /api/v1/public/refund-policy
GET /api/v1/public/disclaimer
GET /api/v1/public/editorial-policy
```

**Testing Locally:**
```bash
curl -H "X-Tenant-Domain: yourdomain.com" \
  https://api.kaburlumedia.com/api/v1/public/privacy-policy
```

---

## Frontend Integration

### File Structure
```
lib/api/tenantApi.js          # API service with pagesApi
components/admin/tabs/
  TenantPagesTab.jsx           # Main UI component
pages/admin/tenants/[id]/
  [[...tab]].js                # Route handler
```

### 1. API Service (`lib/api/tenantApi.js`)

```javascript
export const pagesApi = {
  /** GET /tenants/:tenantId/pages */
  list: (tenantId) => request(`/tenants/${tenantId}/pages`),
  
  /** GET /tenants/:tenantId/pages/:slug */
  get: (tenantId, slug) => request(`/tenants/${tenantId}/pages/${slug}`),
  
  /** PUT /tenants/:tenantId/pages/:slug */
  upsert: (tenantId, slug, payload) => request(`/tenants/${tenantId}/pages/${slug}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  
  /** PATCH /tenants/:tenantId/pages/:slug */
  patch: (tenantId, slug, payload) => request(`/tenants/${tenantId}/pages/${slug}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
  
  /** DELETE /tenants/:tenantId/pages/:slug */
  delete: (tenantId, slug) => request(`/tenants/${tenantId}/pages/${slug}`, {
    method: 'DELETE',
  }),
}
```

### 2. Component Usage (`TenantPagesTab.jsx`)

The component is already integrated and provides:
- **List View**: Shows all default pages with status indicators
- **Editor**: Rich text editor for HTML content
- **Status Management**: Publish/unpublish pages
- **Meta Information**: Title and keywords

**Supported Pages:**
- Privacy Policy (`privacy-policy`)
- Terms of Service (`terms-of-service`)
- About Us (`about-us`)
- Contact (`contact`)
- Refund Policy (`refund-policy`)

---

## Usage Examples

### Creating a Page via API

**Using cURL:**
```bash
curl -X PUT \
  https://api.kaburlumedia.com/api/v1/tenants/TENANT_ID/pages/refund-policy \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPERADMIN_TOKEN" \
  -d '{
    "title": "Refund Policy",
    "contentHtml": "<h1>Refund Policy</h1><p>Our refund terms...</p>",
    "meta": { "keywords": "refund, policy, payment" },
    "published": true
  }'
```

**Using JavaScript (Next.js Server Action):**
```javascript
import { pagesApi } from '@/lib/api/tenantApi'

async function createRefundPolicy(tenantId) {
  const payload = {
    title: 'Refund Policy',
    contentHtml: '<h1>Refund Policy</h1><p>Our refund terms...</p>',
    meta: { keywords: 'refund, policy, payment' },
    published: true
  }
  
  const result = await pagesApi.upsert(tenantId, 'refund-policy', payload)
  return result
}
```

### Updating Page Status

```javascript
// Publish a page
await pagesApi.patch(tenantId, 'privacy-policy', { published: true })

// Unpublish a page
await pagesApi.patch(tenantId, 'privacy-policy', { published: false })
```

### Fetching Pages for Frontend Display

```javascript
// Get published privacy policy for display
const page = await fetch(
  'https://api.kaburlumedia.com/api/v1/public/privacy-policy',
  {
    headers: {
      'X-Tenant-Domain': 'yourdomain.com'
    }
  }
).then(res => res.json())

// Display in React component
function PrivacyPage() {
  return (
    <div>
      <h1>{page.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: page.contentHtml }} />
    </div>
  )
}
```

---

## Admin Panel Access

1. **Navigate to Tenant Management:**
   - Go to `/admin/tenants`
   - Select a tenant

2. **Access Legal Pages Tab:**
   - Click on "Legal Pages" in the left sidebar
   - URL: `/admin/tenants/[TENANT_ID]/pages`

3. **Manage Pages:**
   - Click on any page card (Privacy Policy, Terms, etc.)
   - Edit title, content (HTML), and meta keywords
   - Toggle published status
   - Save or Delete

---

## Environment Configuration

Ensure your `.env.local` file has:

```bash
# Backend API URL
NEXT_PUBLIC_API_BASE=https://api.kaburlumedia.com
# OR
NEXT_PUBLIC_BACKEND_URL=https://api.kaburlumedia.com

# For server-side calls
KABURLU_BACKEND_URL=https://api.kaburlumedia.com
```

---

## Proxy Configuration

The app uses a proxy to avoid CORS issues:

**Client requests:**
```
Browser → /api/proxy/tenants/123/pages → Next.js Proxy → https://api.kaburlumedia.com/api/v1/tenants/123/pages
```

**Proxy Handler:** `/pages/api/proxy/[...path].js`
- Forwards all requests with Authorization header
- Supports GET, POST, PUT, PATCH, DELETE
- Returns JSON responses

---

## Testing Checklist

- [ ] List all pages for a tenant
- [ ] Create a new page (Privacy Policy)
- [ ] Update existing page content
- [ ] Change page status (publish/unpublish)
- [ ] Delete a page
- [ ] Fetch public page via domain resolver
- [ ] Verify HTML rendering in frontend

---

## Troubleshooting

### Issue: 401 Unauthorized
**Solution:** Check if your bearer token is valid and has SUPER_ADMIN role.

### Issue: 404 Not Found
**Solution:** Verify:
- Tenant ID is correct
- Page slug matches exactly (e.g., `privacy-policy`, not `privacy_policy`)
- Backend URL is `https://api.kaburlumedia.com`

### Issue: CORS Error
**Solution:** Use the `/api/proxy` route instead of direct backend calls from browser.

### Issue: Page not showing on frontend
**Solution:** 
- Check `published` status is `true`
- Verify domain resolution is working (check `X-Tenant-Domain` header)
- Ensure page content is not empty

---

## API Response Examples

### Success Response (Create/Update):
```json
{
  "slug": "privacy-policy",
  "title": "Privacy Policy",
  "contentHtml": "<h1>Privacy Policy</h1>",
  "meta": { "keywords": "privacy" },
  "published": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Error Response:
```json
{
  "error": "Unauthorized",
  "message": "SUPER_ADMIN role required",
  "statusCode": 401
}
```

---

## Notes

1. **Refund Policy Auto-Generation:** The backend doesn't auto-generate refund-policy. You must create it manually via PUT/PATCH APIs or the admin panel.

2. **HTML Content:** The `contentHtml` field accepts raw HTML. Ensure proper sanitization on the frontend when displaying.

3. **Meta Keywords:** Used for SEO purposes. Store as `{ keywords: "keyword1, keyword2" }`

4. **Slug Format:** Always use kebab-case (e.g., `privacy-policy`, not `privacyPolicy`)

---

## Future Enhancements

- [ ] Rich text editor (WYSIWYG) instead of raw HTML
- [ ] Template system for common pages
- [ ] Auto-generate refund-policy support
- [ ] Versioning/revision history
- [ ] Multi-language support for legal pages
