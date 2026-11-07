/**
 * Super Admin tenant lifecycle — suspend, soft-delete, restore
 * GET /admin/tenants
 */
import { apiClient } from '../client'

export const tenantLifecycleApi = {
  list(params = {}) {
    const query = {
      page: String(params.page ?? 1),
      pageSize: String(params.pageSize ?? 100),
    }
    if (params.includeDeleted) query.includeDeleted = 'true'
    if (params.includeSuspended) query.includeSuspended = 'true'
    return apiClient.get('/admin/tenants', query)
  },

  suspend(tenantId, reason) {
    return apiClient.post(`/admin/tenants/${encodeURIComponent(tenantId)}/suspend`, { reason })
  },

  unsuspend(tenantId) {
    return apiClient.post(`/admin/tenants/${encodeURIComponent(tenantId)}/unsuspend`, {})
  },

  softDelete(tenantId, reason) {
    return apiClient.post(`/admin/tenants/${encodeURIComponent(tenantId)}/soft-delete`, { reason })
  },

  restore(tenantId) {
    return apiClient.post(`/admin/tenants/${encodeURIComponent(tenantId)}/restore`, {})
  },
}

export default tenantLifecycleApi
