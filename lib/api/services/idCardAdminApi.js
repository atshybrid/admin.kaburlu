/**
 * Super Admin — expired ID card renewal (subscription ON)
 * POST /admin/id-cards/renew-expired-active-subscriptions
 * POST /admin/tenants/:tenantId/reporters/:reporterId/id-card/renew-if-expired
 */
import { apiClient } from '../client'

export const idCardAdminApi = {
  renewExpiredBatch(body = {}) {
    return apiClient.post('/admin/id-cards/renew-expired-active-subscriptions', body)
  },

  renewReporterIfExpired(tenantId, reporterId) {
    return apiClient.post(
      `/admin/tenants/${encodeURIComponent(tenantId)}/reporters/${encodeURIComponent(reporterId)}/id-card/renew-if-expired`,
      {},
    )
  },
}

export default idCardAdminApi
