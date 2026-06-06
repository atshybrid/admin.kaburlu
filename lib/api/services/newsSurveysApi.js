/**
 * News Surveys — Super Admin API
 * Base: /api/v1/admin/news-surveys
 */
import { apiClient } from '../client'

const BASE = '/admin/news-surveys'

export const newsSurveysApi = {
  /** POST /admin/news-surveys */
  create: (body) => apiClient.post(BASE, body),

  /** GET /admin/news-surveys?page=&pageSize=&status=&tenantId= */
  list: (params = {}) => apiClient.get(BASE, params),

  /** GET /admin/news-surveys/:id */
  get: (id) => apiClient.get(`${BASE}/${encodeURIComponent(id)}`),

  /** GET /admin/news-surveys/:id/submissions */
  listSubmissions: (surveyId, params = {}) =>
    apiClient.get(`${BASE}/${encodeURIComponent(surveyId)}/submissions`, params),

  /** GET /admin/news-surveys/submissions/all */
  listAllSubmissions: (params = {}) =>
    apiClient.get(`${BASE}/submissions/all`, params),
}

export default newsSurveysApi
