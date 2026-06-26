/**
 * PRGI (Press Registration) API Service
 * Handles PRGI status and actions (submit, verify, reject)
 * Uses apiClient for consistent API calls through proxy
 */
import { apiClient } from '../client'

export const prgiApi = {
  /**
   * GET /prgi/:tenantId
   * Get PRGI status for a tenant
   */
  getStatus: (tenantId) => apiClient.get(`/prgi/${tenantId}`),
  
  /**
   * POST /prgi/:tenantId/submit
   * Submit PRGI for verification
   */
  submit: (tenantId) => apiClient.post(`/prgi/${tenantId}/submit`),
  
  /**
   * POST /prgi/:tenantId/verify
   * Verify/Approve PRGI
   */
  verify: (tenantId) => apiClient.post(`/prgi/${tenantId}/verify`),
  
  /**
   * POST /prgi/:tenantId/reject
   * Reject PRGI with optional reason
   */
  reject: (tenantId, reason = '') => apiClient.post(`/prgi/${tenantId}/reject`, { reason }),

  /**
   * GET /prgi/newspapers?q=&page=1&limit=20
   * Registered newspaper titles (PRGI registry) for union member forms.
   */
  searchNewspapers: async (q, { page = 1, limit = 20, sortOrder = 'asc' } = {}) => {
    const raw = await apiClient.get('/prgi/newspapers', {
      q: String(q || '').trim(),
      page,
      limit,
      sortOrder,
    })
    const items = raw?.items || raw?.data?.items || []
    return {
      ...raw,
      items: Array.isArray(items) ? items : [],
    }
  },
}
