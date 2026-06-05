/**
 * India Political Parties — Super Admin API
 * Base: /api/v1/political-parties
 */
import { apiClient } from '../client'

const ADMIN = '/political-parties/admin'

export const politicalPartiesApi = {
  /** GET /political-parties/admin?q=&page=&limit= */
  listAdmin: (params = {}) => apiClient.get(ADMIN, params),

  /** GET /political-parties/admin/:id */
  getAdmin: (id) => apiClient.get(`${ADMIN}/${id}`),

  /** POST /political-parties/admin */
  create: (body) => apiClient.post(ADMIN, body),

  /** PUT /political-parties/admin/:id/colors */
  updateColors: (id, body) => apiClient.put(`${ADMIN}/${id}/colors`, body),

  /** PUT /political-parties/admin/:id/symbol */
  updateSymbol: (id, body) => apiClient.put(`${ADMIN}/${id}/symbol`, body),

  /** POST /political-parties/admin/:id/symbol/upload — multipart field: file */
  uploadSymbol: (id, formData) => apiClient.upload(`${ADMIN}/${id}/symbol/upload`, formData),

  /** DELETE /political-parties/admin/:id — deactivate */
  deactivate: (id) => apiClient.delete(`${ADMIN}/${id}`),

  /** Public — no auth required (via proxy) */
  searchPublic: (params = {}) => apiClient.get('/political-parties', params),

  /** GET /political-parties/:partyCode */
  getPublicByCode: (partyCode) =>
    apiClient.get(`/political-parties/${encodeURIComponent(partyCode)}`),
}

export default politicalPartiesApi
