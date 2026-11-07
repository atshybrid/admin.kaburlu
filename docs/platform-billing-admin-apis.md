# Platform Admin — Billing Console APIs

Base: `https://api.kaburlumedia.com/api/v1`  
Auth: `Authorization: Bearer <SUPER_ADMIN JWT>`

తెలుగు సంక్షిప్తం: ఒకే tenant కి wallet recharge / platform fee (base+GST) / reporter dues — **custom date** (`from`, `to` = `YYYY-MM-DD` IST). Reporter subscription **due / pending / complete / off** filters + admin **on-off**, **start date**, **cancel pending order**, **rotate new order**.

---

## Production deploy (admin vs API)

Admin `main` Vercel కి push అయినా, **API droplet deploy లేకుండా** కింది routes **404**:

| Admin feature | Backend routes (under `/api/v1`) |
|---------------|----------------------------------|
| Platform Billing hub tabs | `/admin/billing/tenants/:id/dashboard`, `wallet-transactions`, `reporters-subscriptions`, subscription PATCH, `wallet-billing-flags`, … |
| Tenant suspend / soft delete | `GET /admin/tenants`, `POST .../suspend`, `soft-delete`, `restore` |
| Wallet date range | `GET /admin/tenants/:id/tenant-wallet/transactions?from&to` |
| ID card auto-renew (manual batch) | `POST /admin/id-cards/renew-expired-active-subscriptions` |

**One command (includes Prisma migrate on droplet):**

```bash
cd kaburlu_media_backend && npm run deploy:droplet
```

After deploy: hard refresh → **Platform Billing** → pick tenant → hub tabs. Still 404 = deploy pending or wrong API base URL.

See also: `docs/reporter-id-card-auto-renewal.md`

---

## Existing (unchanged — still use these)

| API | Purpose |
|-----|---------|
| `GET /admin/tenant-wallets` | All tenant wallets list |
| `GET/PATCH/POST .../tenant-wallet/*` | Settings, recharge, monthly fee — see `docs/superadmin-tenant-billing-apis.md` |
| `GET /reporters-dues` | All tenants reporter dues (snapshot) |
| `GET /tenants/:tenantId/reporters-dues` | Per-tenant dues |
| `GET /tenants/:tenantId/subscription-summary` | On/off counts |
| `PATCH /tenants/:tenantId/reporters/:reporterId/subscription` | Tenant admin + super (editorial scope) |
| `POST .../payments/exempt` | Waive month (EXEMPTED) |
| `GET/PATCH /tenants/:tenantId/reporter-pricing` | Base fare defaults + GST/gateway % |

**Date on wallet txs (extended):**  
`GET /admin/tenants/:tenantId/tenant-wallet/transactions?from=2026-11-01&to=2026-11-30`

---

## New — Billing dashboard (one screen)

### `GET /admin/billing/tenants/:tenantId/dashboard?from=&to=`

**Returns:**

- `wallet` — balance, status, **monthly platform base + GST + total** (`platformFee`)
- `walletLedger` (when `from`/`to` set or all-time if omitted):
  - `rechargeTotalMinor` — `MANUAL_RECHARGE` + `RAZORPAY_TOPUP`
  - `platformFeeTotalMinor` — `MONTHLY_PLATFORM_FEE`
  - `reporterCreditTotalMinor` — `REPORTER_PAYMENT`
  - `byReferenceType[]` — breakdown
- `reporterSubscriptionFees` — default GST % + gateway % for reporter subscription
- `reporterBillingDayOfMonth` — tenant billing day (1–28)
- `subscriptionSummary` — reporters on/off
- `reporterDues` — count, total ₹ due, top 20 rows

---

## New — Wallet transactions (dated)

### `GET /admin/billing/tenants/:tenantId/wallet-transactions`

Query: `page`, `pageSize`, `type`, `referenceType`, `from`, `to` (IST dates).

---

## New — Reporter subscription ledger

### `GET /admin/billing/tenants/:tenantId/reporters-subscriptions`

Query:

| Param | Values |
|-------|--------|
| `bucket` | `all` \| `due` \| `pending` \| `complete` \| `off` |
| `from`, `to` | Filter **payment activity** in range (optional) |

Each reporter row includes:

- `monthlySubscriptionAmountRupees`, `feeBreakdown` (base, GST, gateway, **total**)
- `bucket`, `dueAmountRupees`, `outstandingMonths`
- `pendingPayments`, `recentPayments`

---

## New — Admin subscription controls

### `PATCH /admin/billing/tenants/:tenantId/reporters/:reporterId/subscription`

```json
{
  "subscriptionActive": true,
  "monthlySubscriptionAmount": 500,
  "subscriptionActivationDate": "2026-03-01T00:00:00.000Z"
}
```

Future `subscriptionActivationDate` → `subscriptionActive` stays false until date (same as tenant admin).

Turning **off** → auto-expires PENDING payment rows.

---

## New — Order lifecycle

### `POST .../reporters/:reporterId/payments/cancel-pending`

Expires all PENDING `ONBOARDING` / `MONTHLY_SUBSCRIPTION` rows.

### `POST .../reporters/:reporterId/payments/rotate-order`

```json
{
  "forceRotate": true,
  "monthlySubscriptionAmount": 1000
}
```

Optional amount patch, then **new combined Razorpay order** (old pending expired).

### `POST /admin/billing/tenants/:tenantId/activate-scheduled-subscriptions`

Runs scheduled `subscriptionActivationDate` activation for that tenant only.

---

## New — Wallet billing on/off (tenant)

### `PATCH /admin/billing/tenants/:tenantId/wallet-billing-flags`

```json
{
  "deactivated": true,
  "excludeFromActiveList": true
}
```

Stored in `TenantSettings.data.walletBilling`.

---

## Bucket meanings

| bucket | Meaning |
|--------|---------|
| `due` | Subscription on, unpaid months (no open Razorpay pending) |
| `pending` | Has `ReporterPayment.status = PENDING` |
| `complete` | Subscription on, nothing outstanding |
| `off` | `subscriptionActive = false` |

---

## UI flow suggestion

1. Pick tenant → **dashboard** with date range (recharges vs platform fee vs reporter credits).
2. Tab **reporters-subscriptions** with `bucket=due` and `bucket=pending`.
3. Row actions: PATCH subscription, cancel-pending, rotate-order after amount change.
4. Wallet recharge / fee settings → existing `/admin/tenants/.../tenant-wallet/*`.
