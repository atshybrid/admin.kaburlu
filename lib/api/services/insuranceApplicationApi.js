/**
 * Union insurance application — admin review (SUPER_ADMIN / UNION_MODERATOR)
 */
import { apiClient } from '../client'
import { normalizeInsuranceApplicationDetail } from '../../journalist/insuranceApplicationDisplay'

const BASE = '/journalist/union-admin'

export const insuranceApplicationApi = {
  /** GET /journalist/union-admin/insurance-applications */
  listPending: async (params = {}) => {
    const raw = await apiClient.get(`${BASE}/insurance-applications`, params)
    const items = raw?.items || raw?.data?.items || []
    return {
      ...raw,
      items: Array.isArray(items) ? items : [],
    }
  },

  /** GET /journalist/union-admin/members/:profileId/insurance-application?type= */
  getApplication: async (profileId, type) => {
    const raw = await apiClient.get(
      `${BASE}/members/${encodeURIComponent(profileId)}/insurance-application`,
      { type }
    )
    return normalizeInsuranceApplicationDetail(raw)
  },

  /** PATCH /journalist/union-admin/members/:profileId/insurance-application/review */
  review: (profileId, body) =>
    apiClient.patch(
      `${BASE}/members/${encodeURIComponent(profileId)}/insurance-application/review`,
      body
    ),
}

export default insuranceApplicationApi
