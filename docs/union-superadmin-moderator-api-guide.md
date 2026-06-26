# Union Super Admin & Union Moderator API Guide

**Roles with full union access:** `SUPER_ADMIN`, `UNION_MODERATOR` (all unions, all states)

**Base:** `https://api.kaburlumedia.com/api/v1`  
**Auth:** `Authorization: Bearer <accessToken>` (token value only)

**Admin UI:** `/admin/journalist-union` · `/admin/union-surveys`

---

## Recommended flow

```
Login (SUPER_ADMIN or UNION_MODERATOR)
  ↓
1. GET  /journalist/union-admin/members/pending
2. GET  /journalist/union-admin/members/{profileId}
3. POST /journalist/union-admin/members/{profileId}/photo
4. POST /journalist/union-admin/members/{profileId}/documents
5. PATCH /journalist/union-admin/members/{profileId}/verification
6. PATCH /journalist/union-admin/members/{profileId}/insurance-documents
7. PATCH /journalist/union-admin/members/{profileId}/membership
8. POST /journalist/union-admin/members/{profileId}/id-card/generate
9. GET  /journalist/union-admin/members/{profileId}/id-card/download
```

Upload → status `PENDING`. Approve before ID card download.

---

## Section A — Members

### Pending queue
`GET /journalist/union-admin/members/pending?status=all_pending&page=1&limit=20`

`status`: `all_pending` | `pending_membership` | `pending_verification` | `pending_insurance_docs`

### Member detail
`GET /journalist/union-admin/members/{profileId}`

### Create member
`POST /journalist/admin/members/create` (multipart)  
Required: `mobileNumber`, `unionName`, `memberType`

### Edit profile
`PATCH /journalist/union-admin/members/{profileId}`

---

## Section B — Documents

| Action | Method | Path |
|--------|--------|------|
| Upload photo | POST | `.../photo` (multipart `file`) |
| Upload KYC | POST | `.../documents` (`document` + `file`) |
| Approve photo + working ID | PATCH | `.../verification` |
| Approve Aadhaar + PAN | PATCH | `.../insurance-documents` |

---

## Section C — Membership

`PATCH /journalist/union-admin/members/{profileId}/membership`

```json
{ "approved": true, "pressId": "DJWF-2026-0101", "generateIdCard": true }
```

---

## Section D — ID card

| Method | Path |
|--------|------|
| GET | `.../id-card` |
| POST | `.../id-card/generate` |
| POST | `.../id-card/regenerate` |
| GET | `.../id-card/download` → PDF |

---

## Section E — Insurance

`POST /journalist/union-admin/members/{id}/insurance`  
`POST /journalist/union-admin/members/{id}/insurance/{insuranceId}/card`

---

## Section F — Surveys

Base: `/journalist/admin/surveys` — list, create, assign, publish, approve/reject submissions.

---

## Section G — Elections

`GET /journalist/admin/elections/readiness`  
`POST /journalist/admin/elections/conduct`

---

## Section H — Settings & union admins (Super Admin)

| Method | Path |
|--------|------|
| GET/PUT | `/journalist/admin/settings` |
| POST | `/journalist/admin/assign-union-admin` |
| GET | `/journalist/admin/union-admins` |

---

## Error codes

| HTTP | code | Meaning |
|------|------|---------|
| 403 | `UNION_MEMBER_ADMIN_REQUIRED` | Wrong role |
| 404 | `NOT_FOUND` | Member not found |
| 400 | `FILE_REQUIRED` | No file |
| 400 | `INVALID_DOCUMENT` | Wrong document type |
| 400 | `INSURANCE_DOCS_REQUIRED` | Aadhaar/PAN not approved |
| 409 | `UNION_MEMBER_ALREADY_EXISTS` | Duplicate mobile |

## Document status

`PENDING` → after upload  
`APPROVED` → after admin approve  
`REJECTED` → re-upload allowed
