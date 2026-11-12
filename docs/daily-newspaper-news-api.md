# Daily Newspaper News — Public feed API

Admin screen: **Daily Newspaper News** (`DailyNewspaperNewsView`).

## Endpoint

```http
GET /api/v1/public/newspaper-news/tenant-feed
```

No JWT required (admin may still send JWT via API client).

**Base URL:** `https://api.kaburlumedia.com/api/v1`

See backend canonical copy: `kaburlu_media_backend/docs/frontend/DAILY_NEWSPAPER_NEWS_API.md`

## Admin default query

| Param | Value |
|-------|--------|
| `timeRule` | `newsroom` (edition day 06:00–23:59 IST) |
| `contentSource` | `reporter` (no desk syndication) |
| `view` | `both` |
| `includeFilterOptions` | `true` |
| `page` / `pageSize` | Pagination (default page 1, size 500) |

UI maps **Best / Desk / All** → `contentSource` = `reporter` \| `desk` \| `all`.

## Related

- Tenants list: `GET /tenants?full=true`
- Not used on this screen: `GET /newspaper-articles/smart-get`
