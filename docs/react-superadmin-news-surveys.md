# News Surveys — Super Admin (Next.js)

**Route:** `/admin/news-surveys`  
**View:** `components/dashboard/newsSurveys/NewsSurveysView.jsx`  
**API client:** `lib/api/services/newsSurveysApi.js`

## Production APIs

**Base:** `https://api.kaburlumedia.com/api/v1`  
**Proxy (browser):** `/api/proxy/admin/news-surveys`  
**Auth:** `Authorization: Bearer <SUPER_ADMIN_JWT>`

| Action | Method | Path |
|--------|--------|------|
| Create survey | POST | `/admin/news-surveys` |
| List surveys | GET | `/admin/news-surveys` |
| Get survey | GET | `/admin/news-surveys/{id}` |
| Submissions (one survey) | GET | `/admin/news-surveys/{id}/submissions` |
| All submissions | GET | `/admin/news-surveys/submissions/all` |

## UI features

- **Create survey** — title, question, party picker (`GET /political-parties?q=`), frame image upload (`/api/admin/media/upload` → `news-surveys/frames`), answer chips with colors
- **All surveys** — status filters, search, response counts, party chip preview
- **Reporter responses** — table of all video submissions (mobile, survey, answer, video link)
- **Survey detail panel** — full survey + per-survey video list with inline player

## Party dropdown

```http
GET /api/v1/political-parties?limit=100&q=BJP
```

→ `politicalPartyId` in create body.

## Frame upload

```javascript
import { uploadMedia } from '@/lib/api/services/mediaApi'
const { url } = await uploadMedia(file, 'news-surveys/frames')
// → frameImageUrl in create body
```

## Create body example

```json
{
  "title": "2026 Election Survey",
  "question": "Meeku ye party gelustundi?",
  "politicalPartyId": "clparty_xxx",
  "frameImageUrl": "https://cdn.../frame.png",
  "tenantId": null,
  "answers": [
    { "id": "BJP", "label": "BJP", "color": "#FF9933" },
    { "id": "INC", "label": "Congress", "color": "#19AAED" }
  ]
}
```
