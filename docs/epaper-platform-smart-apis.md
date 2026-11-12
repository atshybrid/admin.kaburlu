# ePaper Smart + Platform APIs (admin)

Canonical backend docs:

- `kaburlu_media_backend/docs/frontend/EPAPER_PLATFORM_SMART_APIS_TE.md`
- `kaburlu_media_backend/docs/react-epaper-smart-design-integration.md`

## Where it lives in admin

| Surface | Path |
|---------|------|
| Tenant ePaper settings | `/admin/tenants/[id]/epaper` → `TenantEpaperTab` |
| Editions CRUD | `/admin/tenants/[id]/editions` → `TenantEditionsTab` |
| Reporter copy desk | `/admin/daily-newspaper-news` |

## Client modules

| API | Client |
|-----|--------|
| Smart design CRUD, context, collect-news | `lib/api/services/smartDesignApi.js` → proxy `/api/admin/proxy/epaper/smart-design/*` |
| Tenant newspaper-config | `lib/api/services/epaperApi.js` → `/api/admin/epaper/newspaper-config` |
| Form mapping | `lib/epaper/smartDesignForm.js`, `lib/epaper/newspaperConfigForm.js` |

Auth: Admin JWT; SUPER_ADMIN sends `X-Tenant-Id` via proxy headers.

## Not integrated yet (backend roadmap)

- `pageCategoryPlan` persistence on smart-design
- `newsOpenTime` (06:00) on config — use `tenant-feed?timeRule=newsroom` for desk list
- Ads → header auto-fill
