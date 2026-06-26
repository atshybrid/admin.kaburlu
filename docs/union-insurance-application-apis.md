# Union Insurance Application APIs

**Admin roles:** `SUPER_ADMIN`, `UNION_MODERATOR`  
**Base:** `https://api.kaburlumedia.com/api/v1`  
**Auth:** `Authorization: Bearer <accessToken>`

**Admin UI:** `/admin/journalist-union` → Insurance tab

---

## Flow

```
Aadhaar + PAN upload → Admin docs approve → Survey / unlock
  → Member fills insurance form → Submit
  → Admin APPROVE form → Assign policy → Upload insurance card
```

---

## Admin APIs

| Action | Method | Path |
|--------|--------|------|
| Pending list | GET | `/journalist/union-admin/insurance-applications?status=SUBMITTED&type=HEALTH` |
| Full detail | GET | `/journalist/union-admin/members/{profileId}/insurance-application?type=HEALTH` |
| Approve / reject | PATCH | `/journalist/union-admin/members/{profileId}/insurance-application/review` |
| Assign policy | POST | `/journalist/union-admin/members/{profileId}/insurance` |
| Upload card | POST | `/journalist/union-admin/members/{profileId}/insurance/{insuranceId}/card` |

### Review body

```json
{ "type": "HEALTH", "action": "APPROVE", "reviewNote": "All details verified" }
```

### Assign policy (after form APPROVED)

```json
{
  "type": "HEALTH",
  "policyNumber": "POL123456",
  "insurer": "Star Health",
  "coverAmount": 300000,
  "premium": 2500,
  "validFrom": "2026-07-01",
  "validTo": "2027-06-30",
  "skipApplicationCheck": false
}
```

---

## Member APIs (union app)

- `GET /journalist/insurance-application/schema?type=ACCIDENTAL|HEALTH`
- `GET /journalist/insurance-application?type=...`
- `PUT /journalist/insurance-application` (draft)
- `POST /journalist/insurance-application/submit`

---

## Error codes

| Code | Meaning |
|------|---------|
| `INSURANCE_DOCS_REQUIRED` | Aadhaar/PAN not approved |
| `INSURANCE_APPLICATION_REQUIRED` | Form not approved |
| `APPLICATION_ALREADY_SUBMITTED` | Pending review |
| `HEALTH_REQUIRES_ACCIDENTAL` | Accidental policy first |

---

## Migration

`prisma/migrations/20260627120000_insurance_applications/`

```bash
npx prisma migrate deploy
```
