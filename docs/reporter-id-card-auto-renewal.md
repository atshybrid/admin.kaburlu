# Reporter ID card — auto renewal (subscription ON)

## Rule

When **all** of these are true:

1. `expiresAt < today`
2. `reporter.subscriptionActive === true`
3. `reporter.active === true`
4. Tenant is **not** deleted/suspended

→ **Same card number**, `issuedAt` = today, `expiresAt` = today + tenant **`validityDays`** (`GET/PATCH /tenants/:id/id-card-settings`, e.g. **180** ≈ 6 months), PDF regenerated (Bunny), WhatsApp `send_idcard_reporter`.

Subscription **OFF** → no auto renew (tenant admin may use full `POST .../id-card/regenerate`).

## Automatic (API server cron)

- Default ~ **9:30 AM IST** — env `REPORTER_ID_CARD_RENEWAL_CRON`
- Batch size default **200** per run
- Disable: `REPORTER_ID_CARD_AUTO_RENEW_ENABLED=false`

## Manual (Super Admin)

```http
POST /api/v1/admin/id-cards/renew-expired-active-subscriptions
Content-Type: application/json

{ "tenantId": "<optional — omit for all tenants>", "limit": 50 }
```

Response includes `scanned`, `renewed`, `skipped`, `failed`, `results[]`.

```http
POST /api/v1/admin/tenants/:tenantId/reporters/:reporterId/id-card/renew-if-expired
```

## Admin UI

Tenant → **ID Cards** tab (Super Admin): **Renew expired (this tenant)** runs the batch API scoped to that tenant (`limit` 50).

Daily cron covers production; manual batch is for testing or catch-up after deploy.

## Flow

```
expiresAt passed?
  ├─ subscription OFF → skip (manual regenerate)
  └─ subscription ON  → issuedAt = now
                        expiresAt = now + validityDays
                        PDF → WhatsApp
```

## Prod checklist

1. `npm run deploy:droplet` (backend + migrate)
2. Per tenant: **ID Cards** → **Validity** → `validityDays` (e.g. 180)
3. Confirm cron env if you need a custom schedule
