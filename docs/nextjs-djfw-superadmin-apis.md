# DJFW Super Admin — API Reference (Next.js)

**Union:** Democratic Journalist Federation (Working) — DJFW  
**Production base URL:** `https://api.kaburlumedia.com/api/v1`  
**Auth header (all admin APIs):** `Authorization: Bearer <JWT>`

## UI integration

| Route | Component |
|-------|-----------|
| `/admin/journalist-union` | `JournalistUnionView` — workflow banner + card tabs |
| Review queue / members | `JournalistUnionMembers` |
| Surveys | `UnionSurveysTab` → `UnionSurveysView` |
| Insurance | `InsuranceMembersTab` + `MemberInsuranceSection` |
| Elections | `ElectionsTab` |
| Committee | `CommitteeTab` (cards, seed defaults, appoint/vacate) |

**Typical flow:** Login → Pending queue → Approve membership + docs → Surveys (create/assign/approve) → Insurance (benefits unlock / assign policy) → Elections → Committee posts.

## Response formats

- **Auth** (`/auth/*`): `{ success, message, data }`
- **Journalist admin** (`/journalist/admin/*`): direct JSON — `{ success, total, items }` or `{ message, member }`
- Survey errors: `{ success: false, error }` · Membership errors: `{ error }`

## API summary

| Feature | Method | Path |
|---------|--------|------|
| Pending queue | GET | `/journalist/admin/members/pending` |
| Approve/reject member | PATCH | `/journalist/admin/members/{id}/approve-membership` |
| Approve/reject docs | PATCH | `/journalist/admin/members/{id}/documents` |
| All members list | GET | `/journalist/admin/members` |
| Member detail | GET | `/journalist/admin/members/{id}` |
| Insurance unlock | PATCH | `/journalist/admin/members/{id}/benefits` |
| Assign policy | POST | `/journalist/admin/members/{id}/insurance` |
| List surveys | GET | `/journalist/admin/surveys` |
| Create survey | POST | `/journalist/admin/surveys` |
| Assign survey | POST | `/journalist/admin/surveys/{id}/assign` |
| Approve submission | POST | `/journalist/admin/surveys/{id}/submissions/{progressId}/approve` |
| Reject submission | POST | `/journalist/admin/surveys/{id}/submissions/{progressId}/reject` |
| Election readiness | GET | `/journalist/admin/elections/readiness` |
| Conduct election | POST | `/journalist/admin/elections/conduct` |
| Seed post defaults | POST | `/journalist/admin/posts/seed-defaults` |
| Appoint post | POST | `/journalist/admin/posts/appoint` |
| Vacate post | DELETE | `/journalist/admin/posts/holders/{id}` |
| Post definitions | GET | `/journalist/posts/definitions` |
| Post holders | GET | `/journalist/president/post-holders` |

## Member list query params

`q`, `unionName`, `memberType`, `membershipStatus`, `surveyStatus`, `insuranceAccidental`, `insuranceHealth`, `state`, `page`, `limit`

## Insurance status labels

| Status | UI |
|--------|-----|
| `LOCKED_SURVEY_REQUIRED` | Locked — complete survey |
| `UNLOCKED_CAN_APPLY` | Ready — assign policy |
| `ACTIVE` | Active |
| `LOCKED_REQUIRES_ACCIDENTAL` | Needs accidental first |

## Next.js client

Service: `lib/api/services/journalistApi.js`  
Normalize: `lib/journalist/djfwNormalize.js`, `lib/journalist/insuranceFlow.js`  
Member lists: `lib/journalist/fetchMemberLists.js`

```javascript
import { journalistApi } from '@/lib/api/services/journalistApi'

// Approve membership
await journalistApi.approveMembership(profileId, {
  approved: true,
  pressId: 'DJFW-2026-0042',
  generateIdCard: true,
})

// Assign insurance
await journalistApi.assignMemberInsurance(profileId, {
  type: 'ACCIDENTAL',
  policyNumber: 'LIC/ACC/2026/00421',
  insurer: 'LIC of India',
  validFrom: '2026-04-01',
  validTo: '2027-03-31',
  skipUnlockCheck: true,
})

// Conduct district election
await journalistApi.conductElection({
  level: 'DISTRICT',
  postId: 'pd_dist_president',
  districtId: 'dist_karimnagar',
  winnerProfileIds: [profileId],
  termStartDate: '2026-06-01',
})
```

## Related docs

- [`react-superadmin-union-surveys.md`](./react-superadmin-union-surveys.md) — survey form fields
- [`react-superadmin-india-political-parties.md`](./react-superadmin-india-political-parties.md) — party picker
