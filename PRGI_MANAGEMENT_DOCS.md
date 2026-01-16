# PRGI Status Management - Implementation Summary

## Overview
Added complete PRGI (Press Registration) status management to the tenant overview page with submit, approve, and reject functionality.

## New Features

### 1. PRGI API Service (`lib/api/services/prgiApi.js`)

Complete API integration for PRGI management:

```javascript
// Get PRGI status
GET /api/v1/prgi/{tenantId}

// Submit PRGI for verification
POST /api/v1/prgi/{tenantId}/submit

// Verify/Approve PRGI
POST /api/v1/prgi/{tenantId}/verify

// Reject PRGI with reason
POST /api/v1/prgi/{tenantId}/reject
```

### 2. Confirmation Dialog Component (`components/ui/ConfirmDialog2.jsx`)

Reusable confirmation dialog with:
- ✅ Multiple variants (danger, warning, primary)
- ✅ Loading states
- ✅ Custom children support (for textarea, inputs, etc.)
- ✅ Customizable button text

### 3. Updated Tenant Overview Page

Added PRGI action buttons based on current status:

#### Status: PENDING
- **Submit for Verification** button
- Submits PRGI to verification team
- Updates status to SUBMITTED

#### Status: SUBMITTED
- **Approve PRGI** button (green)
- **Reject PRGI** button (red)
- Approve: Updates status to VERIFIED
- Reject: Shows dialog with reason textarea

#### Status: VERIFIED
- Shows green checkmark with "PRGI Verified" message
- No action buttons (already approved)

#### Status: REJECTED
- **Resubmit PRGI** button
- Allows resubmission after fixing issues

## UI Flow

### Submit PRGI
1. Click "Submit for Verification"
2. Confirmation dialog appears
3. Click "Submit" to confirm
4. Status updates to SUBMITTED
5. Timestamp (prgiSubmittedAt) is recorded

### Approve PRGI
1. Click "Approve PRGI" (green button)
2. Confirmation dialog appears
3. Click "Approve" to confirm
4. Status updates to VERIFIED
5. Timestamp (prgiVerifiedAt) is recorded

### Reject PRGI
1. Click "Reject PRGI" (red button)
2. Dialog appears with textarea for reason
3. Enter rejection reason
4. Click "Reject" to confirm
5. Status updates to REJECTED
6. Rejection reason and timestamp saved

## Status Badges

| Status | Color | Badge |
|--------|-------|-------|
| PENDING | Yellow | ⚠️ PENDING |
| SUBMITTED | Blue | 🔵 SUBMITTED |
| VERIFIED | Green | ✅ VERIFIED |
| REJECTED | Red | ❌ REJECTED |

## API Response Examples

### Get Status
```json
{
  "id": "cmkh94g0s01eykb21toi1oucu",
  "prgiNumber": "TGTEL/25/A0482",
  "prgiStatus": "SUBMITTED"
}
```

### After Submit
```json
{
  "id": "cmkh94g0s01eykb21toi1oucu",
  "prgiNumber": "TGTEL/25/A0482",
  "prgiStatus": "SUBMITTED",
  "prgiSubmittedAt": "2026-01-16T19:12:12.346Z"
}
```

### After Verify
```json
{
  "id": "cmkh94g0s01eykb21toi1oucu",
  "prgiNumber": "TGTEL/25/A0482",
  "prgiStatus": "VERIFIED",
  "prgiVerifiedAt": "2026-01-16T19:12:36.742Z"
}
```

### After Reject
```json
{
  "id": "cmkh94g0s01eykb21toi1oucu",
  "prgiNumber": "TGTEL/25/A0482",
  "prgiStatus": "REJECTED",
  "prgiRejectedAt": "2026-01-16T19:13:00.000Z",
  "prgiRejectionReason": "Incomplete documentation"
}
```

## Files Modified/Created

### Created:
- ✅ `lib/api/services/prgiApi.js` - PRGI API service
- ✅ `components/ui/ConfirmDialog2.jsx` - Confirmation dialog component

### Modified:
- ✅ `pages/admin/tenants/[id]/new-overview.js` - Added PRGI actions

## Testing Checklist

- [ ] Submit PRGI from PENDING status
- [ ] Approve PRGI from SUBMITTED status
- [ ] Reject PRGI from SUBMITTED status with reason
- [ ] Resubmit PRGI from REJECTED status
- [ ] Verify status badge updates correctly
- [ ] Verify timestamps are displayed correctly
- [ ] Test canceling dialogs
- [ ] Test loading states during API calls
- [ ] Test error handling

## Next Steps

To fully integrate this into your workflow:

1. **Replace the overview page**: Copy `new-overview.js` to the actual tenant detail route
2. **Test with real data**: Verify all API endpoints work correctly
3. **Add notifications**: Show success/error toasts instead of alerts
4. **Add permissions**: Restrict actions based on user role
5. **Add audit log**: Track who approved/rejected PRGIs

## Usage

Navigate to any tenant detail page:
```
/admin/tenants/{tenantId}
```

The PRGI Actions card will show appropriate buttons based on current status.
