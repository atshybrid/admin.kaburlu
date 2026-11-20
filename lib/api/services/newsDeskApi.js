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

  /** Flow A step 1 — optional OG / embed preview before intake */
  previewSource: (sourceUrl) =>
    callPost(`${SYNDICATION_BASE}/source-preview`, { sourceUrl: String(sourceUrl || '').trim() }),
}

export default newsDeskApi