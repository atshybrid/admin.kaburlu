/**
 * Union Surveys — Super Admin API
 * Base: /api/v1/journalist/admin/surveys
 */
import { apiClient, ApiError } from '../client'

const base = (id) => `/journalist/admin/surveys/${encodeURIComponent(String(id || '').trim())}`

async function tryPublish(id) {
  const enc = encodeURIComponent(String(id || '').trim())
  const paths = [
    `${base(id)}/publish`,
    `/journalist/admin/survey-campaigns/${enc}/publish`,
    `/journalist/admin/survey-campaigns/${enc}/activate`,
  ]
  let lastErr
  for (const path of paths) {
    try {
      return await apiClient.post(path, {})
    } catch (err) {
      lastErr = err
      if (!(err instanceof ApiError) || err.status !== 404) throw err
    }
  }
  try {
    return await apiClient.patch(base(id), { campaignStatus: 'ACTIVE', status: 'ACTIVE' })
  } catch (patchErr) {
    throw lastErr || patchErr
  }
}

export const unionSurveysApi = {
  /** GET /journalist/admin/surveys */
  list: (params = {}) => apiClient.get('/journalist/admin/surveys', params),

  /** GET /journalist/admin/surveys/:id */
  get: (id) => apiClient.get(base(id)),

  /** POST /journalist/admin/surveys */
  create: (body) => apiClient.post('/journalist/admin/surveys', body),

  /** POST /journalist/admin/surveys/:id/publish (with fallbacks) */
  publish: (id) => tryPublish(id),

  /** POST /journalist/admin/surveys/:id/assign */
  assign: (id, body) => apiClient.post(`${base(id)}/assign`, body),

  /** GET /journalist/admin/surveys/:id/members */
  listMembers: (id, params = {}) => apiClient.get(`${base(id)}/members`, params),

  /** GET /journalist/admin/surveys/:id/submissions/:progressId */
  getSubmission: (surveyId, progressId) =>
    apiClient.get(`${base(surveyId)}/submissions/${progressId}`),

  /** POST .../approve */
  approveSubmission: (surveyId, progressId, body = {}) =>
    apiClient.post(`${base(surveyId)}/submissions/${progressId}/approve`, body),

  /** POST .../reject */
  rejectSubmission: (surveyId, progressId, body) =>
    apiClient.post(`${base(surveyId)}/submissions/${progressId}/reject`, body),

  /** GET .../report/area */
  areaReport: (id, params = {}) => apiClient.get(`${base(id)}/report/area`, params),

  /** POST .../close */
  close: (id) => apiClient.post(`${base(id)}/close`, {}),
}

export default unionSurveysApi
