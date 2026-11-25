/**
 * News Desk V1 API — list/snapshot (newsdesk) + intake/pipeline/facts (syndication).
 */
import { apiClient } from '../client'
import { unwrapSyndicationResponse } from '../../syndication/apiResponse'
import { buildNewsDeskListQuery } from '../../newsDesk/listQuery'
import { formatNewsDeskError } from '../../newsDesk/apiErrors'

export { buildNewsDeskListQuery, formatNewsDeskError }

const NEWS_DESK_BASE = '/platform/newsdesk'
const SYNDICATION_BASE = '/platform/syndication'

export class NewsDeskApiError extends Error {
  constructor(message, status, data = null, code = null) {
    super(message)
    this.name = 'NewsDeskApiError'
    this.status = status
    this.data = data
    this.code = code || data?.code || null
  }
}

function wrapError(error) {
  if (error?.name === 'ApiError') {
    throw new NewsDeskApiError(error.message, error.status, error.data, error.data?.code)
  }
  throw error
}

async function callGet(path, params) {
  try {
    return await apiClient.get(path, params)
  } catch (error) {
    wrapError(error)
  }
}

async function callPost(path, body) {
  try {
    return await apiClient.post(path, body ?? {})
  } catch (error) {
    wrapError(error)
  }
}

export const newsDeskApi = {
  listJobs: (params = {}) => callGet(`${NEWS_DESK_BASE}/jobs`, buildNewsDeskListQuery(params)),

  getSnapshot: (jobId) => callGet(`${NEWS_DESK_BASE}/jobs/${encodeURIComponent(jobId)}/snapshot`),

  getTenantOutcomes: (jobId) =>
    callGet(`${NEWS_DESK_BASE}/jobs/${encodeURIComponent(jobId)}/tenant-outcomes`),

  patchTenantReview: (jobId, tenantId, body) =>
    apiClient.patch(
      `${NEWS_DESK_BASE}/jobs/${encodeURIComponent(jobId)}/tenants/${encodeURIComponent(tenantId)}/review`,
      body ?? {},
    ),

  async createSubmission(payload) {
    try {
      const response = await apiClient.post(`${SYNDICATION_BASE}/jobs`, payload)
      return unwrapSyndicationResponse(response)
    } catch (error) {
      wrapError(error)
    }
  },

  getPipeline: (jobId) => callGet(`${SYNDICATION_BASE}/jobs/${encodeURIComponent(jobId)}/pipeline`),

  getFacts: (jobId) => callGet(`${SYNDICATION_BASE}/jobs/${encodeURIComponent(jobId)}/facts`),

  retryExtraction: (jobId) =>
    callPost(`${SYNDICATION_BASE}/jobs/${encodeURIComponent(jobId)}/pipeline/retry-extraction`, {}),

  updateJob: (jobId, body) => apiClient.patch(`${SYNDICATION_BASE}/jobs/${encodeURIComponent(jobId)}`, body),

  listWebArticles: (params = {}) => callGet(`${SYNDICATION_BASE}/web-articles`, params),

  getAnalytics: () => callGet(`${NEWS_DESK_BASE}/analytics`),

  listPublishedArticles: (params = {}) =>
    callGet(`${NEWS_DESK_BASE}/published-articles`, params),

  getAssignableRoles: () => callGet(`${NEWS_DESK_BASE}/roles`),

  getOperatorScope: () => callGet(`${NEWS_DESK_BASE}/staff/me`),

  listStaff: () => callGet(`${NEWS_DESK_BASE}/staff`),

  upsertStaff: (body) => callPost(`${NEWS_DESK_BASE}/staff`, body),

  patchStaff: (userId, body) => apiClient.patch(`${NEWS_DESK_BASE}/staff/${encodeURIComponent(userId)}`, body),

  listRoutingRules: () => callGet(`${NEWS_DESK_BASE}/routing-rules`),

  createRoutingRule: (body) => callPost(`${NEWS_DESK_BASE}/routing-rules`, body),

  updateRoutingRule: (id, body) => apiClient.patch(`${NEWS_DESK_BASE}/routing-rules/${encodeURIComponent(id)}`, body),

  getPublishCapabilities: (jobId) =>
    callGet(`${NEWS_DESK_BASE}/jobs/${encodeURIComponent(jobId)}/publish-capabilities`),

  getPublishPreview: (jobId, params = {}) =>
    callGet(`${NEWS_DESK_BASE}/jobs/${encodeURIComponent(jobId)}/publish-preview`, params),

  processExtractionNow: (jobId) =>
    callPost(`${NEWS_DESK_BASE}/jobs/${encodeURIComponent(jobId)}/extraction/process-now`, {}),

  publishWebV2: (jobId, body = {}) =>
    callPost(`${NEWS_DESK_BASE}/jobs/${encodeURIComponent(jobId)}/publish-web`, body),

  publishWebV2Tenant: (jobId, tenantId, body = {}) =>
    callPost(
      `${NEWS_DESK_BASE}/jobs/${encodeURIComponent(jobId)}/tenants/${encodeURIComponent(tenantId)}/publish-web`,
      body,
    ),

  searchLocations: (q, limit = 20) =>
    callGet(`${NEWS_DESK_BASE}/locations/search`, { q: String(q || '').trim(), limit }),

  resolveLocation: (q) =>
    callGet(`${NEWS_DESK_BASE}/locations/resolve`, { q: String(q || '').trim() }),

  getApprovedLocation: (jobId) => callGet(`${NEWS_DESK_BASE}/jobs/${encodeURIComponent(jobId)}/location`),

  approveLocation: (jobId, body) =>
    callPost(`${NEWS_DESK_BASE}/jobs/${encodeURIComponent(jobId)}/location/approve`, body),

  /** Flow A step 1 — optional OG / embed preview before intake */
  previewSource: (sourceUrl) =>
    callPost(`${SYNDICATION_BASE}/source-preview`, { sourceUrl: String(sourceUrl || '').trim() }),
}

export default newsDeskApi