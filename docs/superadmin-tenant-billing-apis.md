# Super Admin — Tenant Billing APIs

Production base: `https://api.kaburlumedia.com/api/v1`

**Auth (all APIs):**
```
Authorization: Bearer <accessToken>
```
Use the `accessToken` value only — not the full login JSON.

---

## 1. Super Admin — Manual Wallet Recharge

**POST** `/admin/tenants/{tenantId}/tenant-wallet/recharge`  
**Role:** `SUPER_ADMIN`

**Request:**
```json
{
  "amountRupees": 10000,
  "description": "Manual top-up"
}
```

**Success `200`:**
```json
{
  "success": true,
  "message": "Wallet recharged",
  "summary": {
    "tenantId": "cmkj8bktv01f9qv1w9esygp8g",
    "status": "ACTIVE",
    "balanceMinor": 1500000,
    "monthlyPlatformFeeBillingDay": 1,
    "canOperate": true
  }
}
```

| HTTP | Error |
|------|-------|
| 401 | Invalid/missing JWT |
| 403 | Not SUPER_ADMIN |
| 400 | `amountRupees` / `amountMinor` missing or invalid |
| 404 | Tenant not found |
| 500 | Recharge failed |

---

## 2. Super Admin — Wallet Fee + Deduct Date

**PATCH** `/admin/tenants/{tenantId}/tenant-wallet/settings`  
**Role:** `SUPER_ADMIN`

₹8000 + GST, 1st day deduct:
```json
{
  "monthlyPlatformFeeRupees": 8000,
  "monthlyPlatformFeeGstPercent": 18,
  "monthlyPlatformFeeBillingDay": 1
}
```

₹12000 + GST, 15th day deduct:
```json
{
  "monthlyPlatformFeeRupees": 12000,
  "monthlyPlatformFeeGstPercent": 18,
  "monthlyPlatformFeeBillingDay": 15
}
```

**Success `200`:**
```json
{
  "success": true,
  "message": "Wallet settings updated",
  "wallet": {
    "monthlyPlatformFeeMinor": 1200000,
    "monthlyPlatformFeeGstPercent": 18,
    "monthlyPlatformFeeBillingDay": 15,
    "monthlyFee": {
      "baseMinor": 1200000,
      "gstPercent": 18,
      "gstMinor": 216000,
      "totalMinor": 1416000
    }
  }
}
```

| HTTP | code | Meaning |
|------|------|---------|
| 400 | `INVALID_BILLING_DAY` | Day not 1–28 |
| 400 | `VALIDATION_ERROR` | Fee/GST invalid |
| 401/403 | — | Auth fail |

**GET wallet:** `GET /admin/tenants/{tenantId}/tenant-wallet`

---

## 3. Reporter Subscription Auto-Deduct Date (Tenant-wise)

Per tenant, set which day of the month reporter subscription becomes due (1–28).

**GET** `/tenants/{tenantId}/reporter-billing-settings`  
**PATCH** `/tenants/{tenantId}/reporter-billing-settings`  
**Roles:** `TENANT_ADMIN` (own tenant) / `SUPER_ADMIN` (any tenant)

**GET `200`:**
```json
{
  "tenantId": "cmkj8bktv01f9qv1w9esygp8g",
  "reporterBilling": {
    "subscriptionBillingDayOfMonth": 5,
    "subscriptionBillingDayLocked": false
  },
  "meta": {
    "billingDayRange": { "min": 1, "max": 28 },
    "defaultBillingDay": 1
  }
}
```

**Tenant Admin PATCH:**
```json
{ "subscriptionBillingDayOfMonth": 5 }
```

**Super Admin PATCH (lock — tenant admin cannot change):**
```json
{
  "subscriptionBillingDayOfMonth": 10,
  "subscriptionBillingDayLocked": true
}
```

| HTTP | code | Meaning |
|------|------|---------|
| 400 | `INVALID_BILLING_DAY` | Not 1–28 |
| 400 | `EMPTY_PATCH` | Body empty |
| 403 | `BILLING_DAY_LOCKED` | Tenant admin tried to change locked day |
| 403 | `SUPER_ADMIN_ONLY` | Tenant admin tried to set lock |
| 404 | `TENANT_NOT_FOUND` | Invalid tenant |

**Logic:** Before the billing day each month, reporters do not see `MONTHLY_SUBSCRIPTION` outstanding for that month.

---

## 4. ID Card Expiry — Days (Tenant-wise)

Expiry is measured in days from issue date. Allowed values only:

**`30` | `90` | `180` | `365`**

Legacy `FIXED_END_DATE` (same calendar date every year) is no longer supported.

**GET** `/tenants/{tenantId}/id-card-settings`  
**PUT** `/tenants/{tenantId}/id-card-settings`  
**Roles:** `TENANT_ADMIN` / `SUPER_ADMIN`

**PUT Request:**
```json
{
  "validityType": "PER_USER_DAYS",
  "validityDays": 365,
  "templateId": "STYLE_1",
  "frontLogoUrl": "https://cdn.example.com/logo.png",
  "primaryColor": "#004f9f",
  "idPrefix": "KM",
  "idDigits": 6
}
```

**Success `200`:**
```json
{
  "tenantId": "cmkj8bktv01f9qv1w9esygp8g",
  "validityType": "PER_USER_DAYS",
  "validityDays": 365,
  "meta": {
    "allowedValidityDays": [30, 90, 180, 365],
    "validityDescription": "ID card expires after validityDays from issue date"
  }
}
```

| HTTP | code | Meaning |
|------|------|---------|
| 400 | `INVALID_VALIDITY_DAYS` | Not 30/90/180/365 |
| 400 | `VALIDITY_TYPE_NOT_ALLOWED` | `FIXED_END_DATE` sent |
| 404 | `TENANT_NOT_FOUND` | Invalid tenant |
| 401/403 | — | Auth fail |

---

## Quick Reference

| Action | Method | Path | Who |
|--------|--------|------|-----|
| Wallet recharge | POST | `/admin/tenants/{id}/tenant-wallet/recharge` | SUPER_ADMIN |
| Wallet fee + day | PATCH | `/admin/tenants/{id}/tenant-wallet/settings` | SUPER_ADMIN |
| Reporter billing day | GET/PATCH | `/tenants/{id}/reporter-billing-settings` | TENANT_ADMIN / SUPER_ADMIN |
| ID card validity | GET/PUT | `/tenants/{id}/id-card-settings` | TENANT_ADMIN / SUPER_ADMIN |

---

## Admin UI

| Feature | Route |
|---------|-------|
| All tenant wallets | `/admin/tenant-wallets` |
| Per-tenant wallet | `/admin/tenants/{id}/tenant-wallet` |
| Reporter billing day | `/admin/tenants/{id}/reporter-billing` |
| ID card settings | `/admin/tenants/{id}/id-cards` |
