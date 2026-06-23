/**
 * Naa Kaburlu Readers — Super Admin API
 * Base: /api/v1/readers/admin
 */
import { apiClient } from '../client'

const ADMIN = '/readers/admin'

export const readersAdminApi = {
  /** GET /readers/admin/pending */
  listPending: () => apiClient.get(`${ADMIN}/pending`),

  /** GET /readers/admin/list */
  list: (params = {}) => apiClient.get(`${ADMIN}/list`, params),

  /** POST /readers/admin/create */
  create: (body) => apiClient.post(`${ADMIN}/create`, body),

  /** POST /readers/admin/:userId/approve */
  approve: (userId) => apiClient.post(`${ADMIN}/${encodeURIComponent(userId)}/approve`, {}),

  /** POST /readers/admin/:userId/reject */
  reject: (userId, reason) =>
    apiClient.post(`${ADMIN}/${encodeURIComponent(userId)}/reject`, { reason: reason || undefined }),

  /** POST /readers/admin/:userId/link-mobile */
  linkMobile: (userId, mobileNumber) =>
    apiClient.post(`${ADMIN}/${encodeURIComponent(userId)}/link-mobile`, { mobileNumber }),

  /** POST /readers/admin/:userId/upgrade-citizen-reporter */
  upgradeCitizenReporter: (userId, notes) =>
    apiClient.post(`${ADMIN}/${encodeURIComponent(userId)}/upgrade-citizen-reporter`, {
      notes: notes || undefined,
    }),

  /** GET /readers/admin/feeds-config */
  getFeedsConfig: () => apiClient.get(`${ADMIN}/feeds-config`),

  /** PUT /readers/admin/feeds-config */
  putFeedsConfig: (personas) => apiClient.put(`${ADMIN}/feeds-config`, { personas }),
}

export default readersAdminApi
