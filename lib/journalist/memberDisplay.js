/** Normalize union member rows from list / pending / detail APIs. */

import { docEffectiveStatus, isDocReviewable } from './idCardFlow'

export const DOC_KEYS = ['photo', 'aadhaar', 'pan', 'workingIdCard']

const DOC_LABELS = {
  photo: 'Photo',
  aadhaar: 'Aadhaar',
  pan: 'PAN',
  workingIdCard: 'Working ID',
}

export function memberName(row) {
  return row?.fullName || row?.user?.profile?.fullName || '—'
}

export function memberMobile(row) {
  return row?.mobileNumber || row?.user?.mobileNumber || '—'
}

export function memberDesignation(row) {
  return row?.designation || row?.currentDesignation || '—'
}

export function memberNewspaper(row) {
  return row?.currentNewspaper || row?.organization || '—'
}

export function memberLocation(row) {
  const parts = [row?.workingArea, row?.mandal, row?.district, row?.state].filter(Boolean)
  if (!parts.length) return '—'
  const unique = [...new Set(parts)]
  return unique.join(' · ')
}

export function memberTypeLabel(row) {
  if (row?.memberType === 'TENANT_REPORTER') return 'Tenant reporter'
  if (row?.memberType === 'NON_TENANT_REPORTER') return 'Non-tenant'
  if (row?.linkedTenantName) return `Tenant · ${row.linkedTenantName}`
  return 'Legacy / app'
}

export function pressCard(row) {
  return row?.pressCard || row?.unionPressCard || row?.card || null
}

export function surveySummary(row) {
  const s = row?.survey
  if (!s) return null
  const status = s.overallStatus || '—'
  const done = s.completedCount ?? 0
  const total = s.totalCampaigns ?? 0
  return total > 0 ? `${status} (${done}/${total})` : status
}

export function insuranceStatus(row, type = 'accidental') {
  return row?.insurance?.[type]?.status || '—'
}

export function pressIdDisplay(row) {
  return row?.pressId || pressCard(row)?.cardNumber || null
}

export function memberPendingSummary(row) {
  const actions = Array.isArray(row?.pendingActions) ? row.pendingActions : []
  if (!actions.length) return '—'
  return actions
    .map((a) => (DOC_LABELS[a] ? DOC_LABELS[a] : a === 'MEMBERSHIP' ? 'Membership' : a))
    .join(', ')
}

export function pendingDocKeys(row) {
  const actions = Array.isArray(row?.pendingActions) ? row.pendingActions : []
  return DOC_KEYS.filter((k) => actions.includes(k))
}

export function membershipPending(row) {
  const actions = Array.isArray(row?.pendingActions) ? row.pendingActions : []
  return actions.includes('MEMBERSHIP')
}

/** StatusBadge `status` prop: pending | approved | rejected */
export function membershipStatusKey(row) {
  if (row?.rejectedAt) return 'rejected'
  if (row?.approved || row?.membershipStatus === 'APPROVED') return 'approved'
  if (row?.membershipStatus === 'REJECTED') return 'rejected'
  return 'pending'
}

export function membershipStatusLabel(row) {
  const key = membershipStatusKey(row)
  if (key === 'approved') return 'Approved'
  if (key === 'rejected') return 'Rejected'
  return 'Pending'
}

/** Doc keys that can be approved/rejected in admin review */
export function reviewableDocKeys(member) {
  const fromActions = pendingDocKeys(member)
  const fromStatus = DOC_KEYS.filter((k) => isDocReviewable(member?.documents?.[k]))
  return [...new Set([...fromActions, ...fromStatus])]
}

export { docEffectiveStatus, isDocReviewable }

export function hasPendingDocuments(row) {
  return reviewableDocKeys(row).length > 0
}

export function documentsSummary(row) {
  const docs = row?.documents
  if (!docs) return { approved: 0, pending: 0, missing: 4, label: 'No docs' }

  let approved = 0
  let pending = 0
  let missing = 0

  DOC_KEYS.forEach((key) => {
    const d = docs[key]
    const st = docEffectiveStatus(d)
    if (st === 'NOT_UPLOADED') {
      missing += 1
    } else if (st === 'APPROVED') {
      approved += 1
    } else if (st === 'PENDING') {
      pending += 1
    } else {
      missing += 1
    }
  })

  const label =
    pending > 0
      ? `${pending} pending`
      : approved === 4
        ? 'All approved'
        : `${approved}/4 approved`

  return { approved, pending, missing, label }
}

export function kycVerifiedFromDocs(row) {
  if (row?.kycVerified === true) return true
  const { approved } = documentsSummary(row)
  return approved >= 4
}

export function formatDate(v) {
  if (!v) return '—'
  try {
    const d = new Date(v)
    if (isNaN(d.getTime())) return String(v)
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
  } catch {
    return String(v)
  }
}

export function docUrl(row, key) {
  return row?.documents?.[key]?.url || null
}
