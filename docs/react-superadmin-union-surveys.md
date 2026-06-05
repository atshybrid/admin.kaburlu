# Union Surveys — React Super Admin

**Admin UI:** `/admin/union-surveys`

**Service:** `lib/api/services/unionSurveysApi.js`

## Flow

```
DRAFT → POST publish → ACTIVE → POST assign → members answer → review → area report → POST close
```

## Key endpoints

| Step | Method | Path |
|------|--------|------|
| List | GET | `/journalist/admin/surveys` |
| Create | POST | `/journalist/admin/surveys` |
| Publish | POST | `/journalist/admin/surveys/{id}/publish` |
| Assign | POST | `/journalist/admin/surveys/{id}/assign` |
| Pending | GET | `/journalist/admin/surveys/{id}/members?reviewStatus=PENDING` |
| Submission | GET | `/journalist/admin/surveys/{id}/submissions/{progressId}` |
| Approve | POST | `.../approve` |
| Reject | POST | `.../reject` |
| Report | GET | `/journalist/admin/surveys/{id}/report/area` |
| Close | POST | `/journalist/admin/surveys/{id}/close` |

Member APIs: `/journalist/union-member-surveys/campaigns/*`

Swagger: **Journalist Union — Super Admin** → surveys
