/**
 * Tenant Platform Wallet — Super Admin API
 */
import { apiClient } from '../client'

export const tenantWalletApi = {
  /** GET /admin/tenant-wallets */
  listWallets: (params = {}) => apiClient.get('/admin/tenant-wallets', params),

  /** GET /admin/tenants/:tenantId/tenant-wallet */
  getWallet: (tenantId) => apiClient.get(`/admin/tenants/${encodeURIComponent(tenantId)}/tenant-wallet`),

  /** PATCH /admin/tenants/:tenantId/tenant-wallet/settings */
  updateSettings: (tenantId, body) =>
    apiClient.patch(`/admin/tenants/${encodeURIComponent(tenantId)}/tenant-wallet/settings`, body),

  /** POST /admin/tenants/:tenantId/tenant-wallet/recharge */
  recharge: (tenantId, body) =>
    apiClient.post(`/admin/tenants/${encodeURIComponent(tenantId)}/tenant-wallet/recharge`, body),

  /** GET /admin/tenants/:tenantId/tenant-wallet/transactions */
  getTransactions: (tenantId, params = {}) =>
    apiClient.get(`/admin/tenants/${encodeURIComponent(tenantId)}/tenant-wallet/transactions`, params),

  /** POST /admin/tenant-wallets/process-monthly-fee */
  processMonthlyFee: (body = {}) => apiClient.post('/admin/tenant-wallets/process-monthly-fee', body),

  /** POST /admin/tenant-wallets/backfill-reporter-credits */
  backfillReporterCredits: (body = {}) =>
    apiClient.post('/admin/tenant-wallets/backfill-reporter-credits', body),
}

export default tenantWalletApi
