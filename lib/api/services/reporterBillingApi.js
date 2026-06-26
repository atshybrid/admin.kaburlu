/**
 * Reporter subscription billing — per-tenant billing day
 * GET/PATCH /tenants/:tenantId/reporter-billing-settings
 */
import { apiClient } from '../client'

export const reporterBillingApi = {
  get: (tenantId) =>
    apiClient.get(`/tenants/${encodeURIComponent(tenantId)}/reporter-billing-settings`),

  patch: (tenantId, body) =>
    apiClient.patch(`/tenants/${encodeURIComponent(tenantId)}/reporter-billing-settings`, body),
}

export default reporterBillingApi
