/** Normalize tenant wallet API responses */

import {
  formatReferenceLabel,
  formatTransactionType,
} from './displayLabels'

export function minorToRupees(minor) {
  const n = Number(minor)
  if (!Number.isFinite(n)) return 0
  return n / 100
}

export function formatRupees(minor, formatted) {
  if (formatted && typeof formatted === 'string') return formatted
  const rupees = minorToRupees(minor)
  return `₹${rupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function unwrapWallet(raw) {
  if (!raw) return null
  if (raw.wallet) return { tenant: raw.tenant, wallet: raw.wallet }
  if (raw.summary) return { wallet: raw.summary, tenant: raw.tenant }
  return { wallet: raw }
}

export function normalizeWalletRow(row) {
  if (!row) return null
  const tenant = row.tenant || {}
  const wallet = row.wallet || row
  const formatted = wallet.formatted || {}
  const monthlyFee = wallet.monthlyFee || {}

  return {
    tenantId: tenant.id || wallet.tenantId,
    tenantName: tenant.name || tenant.slug || '—',
    tenantSlug: tenant.slug || '',
    prgiNumber: tenant.prgiNumber || '',
    status: String(wallet.status || 'ACTIVE').toUpperCase(),
    balanceMinor: Number(wallet.balanceMinor ?? wallet.availableBalanceMinor ?? 0),
    availableBalanceMinor: Number(wallet.availableBalanceMinor ?? wallet.balanceMinor ?? 0),
    monthlyPlatformFeeMinor: Number(wallet.monthlyPlatformFeeMinor ?? monthlyFee.baseMinor ?? 0),
    monthlyPlatformFeeGstPercent: Number(wallet.monthlyPlatformFeeGstPercent ?? monthlyFee.gstPercent ?? 18),
    monthlyPlatformFeeBillingDay: Number(wallet.monthlyPlatformFeeBillingDay ?? 1),
    monthlyFeeTotalMinor: Number(monthlyFee.totalMinor ?? 0),
    formattedBalance: formatted.balance || formatRupees(wallet.balanceMinor),
    formattedMonthlyTotal: formatted.monthlyFeeTotal || formatRupees(monthlyFee.totalMinor),
    canOperate: wallet.canOperate !== false && wallet.status !== 'EXPIRED',
    message: wallet.message || null,
    subscriptionLocked: tenant.subscriptionLocked,
    lockedReason: tenant.lockedReason,
    wallet,
    tenant,
  }
}

export function normalizeWalletList(raw) {
  const data = raw?.data ?? raw?.items ?? (Array.isArray(raw) ? raw : [])
  const items = (Array.isArray(data) ? data : []).map(normalizeWalletRow).filter(Boolean)
  const pagination = raw?.pagination || {}
  return {
    items,
    page: Number(pagination.page ?? 1),
    pageSize: Number(pagination.pageSize ?? 50),
    total: Number(pagination.total ?? items.length),
    totalPages: Number(pagination.totalPages ?? 1),
  }
}

export function normalizeTransaction(tx) {
  if (!tx || typeof tx !== 'object') return null
  const referenceType = tx.referenceType
  const rawLabel = tx.referenceLabel || tx.description || tx.note
  return {
    ...tx,
    type: tx.type,
    direction: tx.direction,
    referenceType,
    displayType: formatTransactionType(tx.type),
    referenceLabel: formatReferenceLabel(rawLabel, referenceType || tx.type),
    amountMinor: Number(tx.amountMinor ?? 0),
    balanceAfterMinor: Number(tx.balanceAfterMinor ?? 0),
    formattedAmount: tx.formatted?.amount || formatRupees(tx.amountMinor),
    formattedBalanceAfter: tx.formatted?.balanceAfter || formatRupees(tx.balanceAfterMinor),
    createdAt: tx.createdAt,
  }
}

export function normalizeTransactionList(raw) {
  const data = raw?.data ?? raw?.transactions ?? raw?.items ?? (Array.isArray(raw) ? raw : [])
  return (Array.isArray(data) ? data : []).map(normalizeTransaction).filter(Boolean)
}

export function walletStatusColor(status) {
  const s = String(status || '').toUpperCase()
  if (s === 'ACTIVE') return 'green'
  if (s === 'EXPIRED') return 'red'
  return 'gray'
}
