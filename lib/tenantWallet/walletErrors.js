import { ApiError } from '../api/client'

export function formatWalletError(err, fallback = 'Something went wrong') {
  if (err instanceof ApiError) {
    const code = err.data?.code
    const msg = err.data?.error || err.data?.message || err.message
    if (code === 'INVALID_BILLING_DAY') return 'Billing day must be between 1 and 28'
    if (code === 'BILLING_DAY_LOCKED') return 'Billing day is locked by Super Admin'
    if (code === 'SUPER_ADMIN_ONLY') return 'Only Super Admin can lock the billing day'
    if (code === 'INVALID_VALIDITY_DAYS') return 'ID validity must be 30, 90, 180, or 365 days'
    if (code === 'VALIDITY_TYPE_NOT_ALLOWED') return 'Fixed end date is no longer supported — use days from issue date'
    return msg || fallback
  }
  return err?.message || err?.error || fallback
}
