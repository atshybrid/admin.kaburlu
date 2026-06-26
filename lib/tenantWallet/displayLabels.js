/** Human-readable labels for wallet UI — no raw internal IDs */

export function billingDayLabel(d) {
  const n = Number(d)
  if (!Number.isInteger(n) || n < 1 || n > 28) return '—'
  if (n === 1) return '1st of month'
  if (n === 2) return '2nd of month'
  if (n === 3) return '3rd of month'
  return `${n}th of month`
}

const TX_TYPE_LABELS = {
  WALLET_RECHARGE: 'Manual recharge',
  MONTHLY_PLATFORM_FEE: 'Monthly platform fee',
  PLATFORM_FEE: 'Platform fee',
  REPORTER_SUBSCRIPTION: 'Reporter subscription',
  REPORTER_CREDIT: 'Reporter credit',
  REPORTER_PAYMENT: 'Reporter payment',
  ADJUSTMENT: 'Balance adjustment',
  REFUND: 'Refund',
  CREDIT: 'Credit',
  DEBIT: 'Debit',
}

export function looksLikeInternalId(value) {
  if (!value || typeof value !== 'string') return false
  const s = value.trim()
  if (/^c[a-z0-9]{20,}$/i.test(s)) return true
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) return true
  return false
}

export function formatTransactionType(type) {
  if (!type) return '—'
  const key = String(type).toUpperCase()
  if (TX_TYPE_LABELS[key]) return TX_TYPE_LABELS[key]
  return String(type)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function formatReferenceLabel(label, referenceType) {
  const raw = String(label || '').trim()
  const type = String(referenceType || '').trim()

  if (raw && !looksLikeInternalId(raw) && raw !== type) return raw
  if (type && !looksLikeInternalId(type)) return formatTransactionType(type)
  return '—'
}

export function walletOperationalLabel(canOperate) {
  return canOperate ? 'Operational' : 'Blocked'
}
