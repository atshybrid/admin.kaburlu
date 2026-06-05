# ePaper Design — API integration guide

**Base URL:** `https://api.kaburlumedia.com/api/v1`  
**Swagger:** use server `https://api.kaburlumedia.com/api/v1` only (not `app.kaburlumedia.com`).

Admin dashboard proxies these routes via `/api/admin/epaper/*` and `/api/admin/proxy/epaper/smart-design/*` with the user JWT.

---

## Recommended flow

| # | Method | Path | Auth | Purpose |
|---|--------|------|------|---------|
| 1 | GET | `/epaper/paper-page-specs` | Optional | Paper trim + print area + header heights |
| 2 | GET | `/admin/epaper/header-styles` or `/epaper/smart-design/header-styles` | Yes | Main 1–10 + sub 1–10 catalog + `renderEngine` |
| 3 | GET | `/epaper/smart-design/context` | Yes | Tenant, editions, PRGI (`X-Tenant-Id` for super admin) |
| 4 | GET | `/epaper/newspaper-config?tenantId=` | Yes | Tenant config + today volume/issue |
| 5 | PUT | `/epaper/newspaper-config?tenantId=` | Yes | Paper type + header style numbers (**no POST**) |
| 6 | GET | `/epaper/settings` | Yes | Layout inches (synced from `paperType`) |
| 7 | GET | `/epaper/smart-design/by-edition` | Yes | Edition design exists? |
| 8 | POST/PATCH | `/epaper/smart-design` | Yes | Per-edition logos, tagline, running comment, etc. |

**Super admin:** `GET /epaper/newspaper-config` without `tenantId` → all tenants.

---

## Paper types (API `paper-page-specs`)

| paperType | Trim | Print area | Main header | Sub header |
|-----------|------|------------|-------------|------------|
| `DIGITAL_PAPER` | 13×18″ | 12×17″ | 3″ | 1″ |
| `TABLOID` | 11×17″ | 10.5×16.5″ | 2.5″ | 0.7″ |
| `BROADSHEET` | 15×22.75″ | 14×21.75″ | 3″ | 1″ |
| `BERLINER` | 12.4×18.5″ | 11.4×17.5″ | 3″ | 1″ |
| `MAGAZINE` | A4 | 7.27×10.69″ | 2″ | 0.75″ |

Public (no token):

```
GET /api/v1/epaper/paper-page-specs
GET /api/v1/public/epaper/paper-page-specs
```

---

## Header styles catalog

```http
GET /api/v1/admin/epaper/header-styles
Authorization: Bearer <JWT>
```

Response includes:

- `mainHeaders[]` — `number`, `key` (e.g. `main_style2`), `name`, `htmlRenderer` (`full` | `generic`)
- `subHeaders[]` — e.g. `sub_header_style1`, `sub_header_style2`
- `paperPageSpecs[]` — same as paper-page-specs
- `renderEngine` — HTML render service paths:

| Path | Purpose |
|------|---------|
| `POST /layout/epaper-header/render/main` | P1 masthead HTML |
| `POST /layout/epaper-header/render/sub` | P2+ running header HTML |
| `POST /layout/epaper-header/render` | Main + sub pair |
| `GET /layout/epaper-header/preview` | Browser preview |

Local engine: `services/epaper-header-html` (default port **3099**).

**Recommended defaults** (from API): `page1Main: 2`, `page2PlusSub: 2` (Prabha + red section bar).

---

## Sample: tenant newspaper config

```http
PUT /api/v1/epaper/newspaper-config?tenantId=YOUR_TENANT_ID
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "paperType": "TABLOID",
  "pageCount": 8,
  "headerStyleNumber": 2,
  "subHeaderStyleNumber": 1,
  "volumeStartNumber": 1,
  "volumeStartDate": "2026-01-01",
  "issueStartNumber": 1,
  "issueStartDate": "2026-01-01",
  "newsCloseTime": "23:00"
}
```

**200** includes: `config`, `today`, `paperPageSpec`, `pageDimensions`.

---

## Edition / sub-edition smart design

1. **Tenant ePaper tab** — select edition or sub-edition → `GET /smart-design/by-edition` → load form → set `headerStyleNumber` / `subHeaderStyleNumber` from catalog dropdowns (fed by header-styles API).
2. **Design studio** — same tenant + edition → `collect-news` + canvas; header preview uses style numbers from loaded smart design.

Proxy examples (admin app):

```bash
# Paper specs (via Next proxy)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/admin/epaper/paper-page-specs

# Header catalog
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/admin/epaper/header-styles
```

---

## Common errors

| Code | Meaning |
|------|---------|
| **401** | No JWT |
| **403** | Not admin |
| **400** | Missing `tenantId` (super admin PUT) |
| **404** | No newspaper config — call PUT first |
| **400** | Invalid `paperType` or `newsCloseTime` |

---

## Admin UI mapping

| UI | API field |
|----|-----------|
| Paper type dropdown | `paperType` / `pageSize` |
| Main header style | `headerStyleNumber` → `main_style{N}` |
| Sub header style | `subHeaderStyleNumber` → `sub_header_style{N}` |
| Center logo (main S1) | `headerLogoUrl` |
| Center logo (main S2) | `paperNameImageUrl` |
| Sub center logo (sub S1) | `subHeaderLogoUrl` |
| Left / right slots | `headerLeftImageUrl`, `headerRightImageUrl` |

React components: `components/epaper/HeaderStyles.js`  
Pure HTML: `services/epaper-header-html/`
