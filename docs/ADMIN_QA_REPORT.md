# Kaburlu Admin QA Report

**Date:** 2026-11-21 (Wave 1.1 production hardening)  
**Environment:** Local Mac — Postgres `127.0.0.1:5434/kaburlu_local`, API `http://127.0.0.1:3011`, admin dev `3000`

---

## Tests executed

| Command | Project | Result |
|---------|---------|--------|
| `npm run build` | admin.kaburlu | **PASS** |
| `npm run test:newsdesk` | admin.kaburlu | **PASS** (24/24) |
| `npm run build` | kaburlu_media_backend | **PASS** |
| `npm run test:newsdesk-w1` | kaburlu_media_backend | **PASS** (39/39) |
| `npm run test:newsdesk-w3` | kaburlu_media_backend | **PASS** (15/15 incl. `w31.publishSkipApproval`) |
| `npm run test:newsdesk-w31-smoke` | kaburlu_media_backend | **PASS** (see evidence below) |

TypeScript: admin uses **JavaScript** (no project-wide `tsc`).

---

## JWT E2E smoke evidence (`test:newsdesk-w31-smoke`)

**Job:** `cmwqm3y010003jyqmotq20wns` (local copy, not prod)  
**User:** platform `SUPER_ADMIN` JWT (signed with `JWT_SECRET`)

| Step | Result |
|------|--------|
| Health `GET /health/ai` | 200 |
| `GET .../publish-capabilities` | 200, `workflow: v2` |
| `GET .../tenant-outcomes` | 200 |
| Dual concurrent `POST .../publish-web` | HTTP **207** + **200**; summary `created=1`, `inProgress=1` |
| Idempotent republish | HTTP 200; **1** tenant `skipped` (already published) |
| `skipApproval` as `NEWS_DESK` | **403** `PUBLISH_APPROVAL_OVERRIDE_DENIED` |
| DB verify `tenantWebArticle` | OK tenant **కబుర్లు టుడే**, slug `article-5`, status `PUBLISHED` |

---

## Wave 1.1 hardening

| Area | Change |
|------|--------|
| Concurrency | `claimTenantForPublish` excludes live `PUBLISHING`; stale reclaim uses `lockVersion` |
| `skipApproval` | Backend-only; `NEWS_DESK_ADMIN` / `publish_override` / `all`; audit `PUBLISH_OVERRIDE` |
| Admin UI | Never sends `skipApproval` |
| Create intake | `NewsDeskLocationSearch` → master district/mandal + `locationHint.master` |
| Legacy publish | Still **409** `V2_USE_PUBLISH_WEB` when pipeline exists |

---

## Verification matrix (publish focus)

| Check | Tested | Evidence |
|-------|:------:|----------|
| V2 publish without masterPrint | ✓ | smoke + w3 unit |
| Duplicate publish prevention | ✓ | idempotent skip count |
| Concurrent single-tenant claim | ✓ | 207/200 dual POST |
| skipApproval RBAC | ✓ | unit + smoke 403 |
| Legacy regression guards | ✓ | w3.publishGuards |
| Create location master search | ✓ | build; manual UI backlog |

---

## Remaining risks (no prod deploy in this session)

1. **Multi-tenant concurrent publish** — smoke exercised one tenant job with concurrent POSTs; not all N-tenant permutations.
2. **`publish_override` permission** — not seeded automatically on existing roles; assign via role JSON or use `NEWS_DESK_ADMIN`.
3. **Full article body/content/image parity** — smoke checks slug/status/tenantId; not HTML body diff vs snapshot.
4. **Staging smoke** — local only (`5434` / `3011`).
5. **Admin UI manual** — publish bar / tenant table not browser-automated in CI.

---

## Security

| Item | Status |
|------|--------|
| JWT + `requireSyndicationDeskRole` on publish routes | Enforced |
| `skipApproval` never trusted from anonymous callers | 403 without privilege |
| Production deploy | **Not performed**