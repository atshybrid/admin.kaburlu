/**
 * Platform billing console — SUPER_ADMIN (/admin/billing/*)
 */
import { apiClient } from '../client'

export const platformBillingApi = {
  getDashboard(tenantId, { from, to } = {}) {
    const params = {}
    if (from) params.from = from
    if (to) params.to = to
    return apiClient.get(`/admin/billing/tenants/${encodeURIComponent(tenantId)}/dashboard`, params)
  },

  getWalletTransactions(tenantId, params = {}) {
    return apiClient.get(
      `/admin/billing/tenants/${encodeURIComponent(tenantId)}/wallet-transactions`,
      params,
    )
  },

  getReportersSubscriptions(tenantId, { bucket = 'all', from, to } = {}) {
    const params = { bucket }
    if (from) params.from = from
    if (to) params.to = to
    return apiClient.get(
      `/admin/billing/tenants/${encodeURIComponent(tenantId)}/reporters-subscriptions`,
      params,
    )
  },

  patchReporterSubscription(tenantId, reporterId, body) {
    return apiClient.patch(
      `/admin/billing/tenants/${encodeURIComponent(tenantId)}/reporters/${encodeURIComponent(reporterId)}/subscription`,
      body,
    )
  },

  cancelPendingPayments(tenantId, reporterId, reason) {
    return apiClient.post(
      `/admin/billing/tenants/${encodeURIComponent(tenantId)}/reporters/${encodeURIComponent(reporterId)}/payments/cancel-pending`,
      reason ? { reason } : {},
    )
  },

  rotateOrder(tenantId, reporterId, body) {
    return apiClient.post(
      `/admin/billing/tenants/${encodeURIComponent(tenantId)}/reporters/${encodeURIComponent(reporterId)}/payments/rotate-order`,
      body,
    )
  },

  activateScheduledSubscriptions(tenantId) {
    return apiClient.post(
      `/admin/billing/tenants/${encodeURIComponent(tenantId)}/activate-scheduled-subscriptions`,
      {},
    )
  },

  patchWalletBillingFlags(tenantId, body) {
    return apiClient.patch(
      `/admin/billing/tenants/${encodeURIComponent(tenantId)}/wallet-billing-flags`,
      body,
    )
  },
}

export default platformBillingApi
