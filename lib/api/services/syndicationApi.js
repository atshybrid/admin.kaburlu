/**
 * Platform Syndication — desk API
 * Base: /api/v1/platform/syndication
 */
import { apiClient } from '../client'

const BASE = '/platform/syndication'

export class SyndicationApiError extends Error {
  constructor(message, status, data = null, code = null) {
    super(message)
    this.name = 'SyndicationApiError'
    this.status = status
    this.data = data
    this.code = code
  }
}

function wrapError(error) {
  if (error?.name === 'ApiError') {
    throw new SyndicationApiError(error.message, error.status, error.data, error.data?.code)
  }
  throw error
}

async function call(method, path, body) {
  try {
    if (method === 'GET') return await apiClient.get(path)
    if (method === 'POST') return await apiClient.post(path, body)
    if (method === 'PATCH') return await apiClient.patch(path, body)
    if (method === 'DELETE') return await apiClient.delete(path)
    throw new Error(`Unsupported method: ${method}`)
  } catch (error) {
    wrapError(error)
  }
}

export const syndicationApi = {
  previewSource: (sourceUrl) => call('POST', `${BASE}/source-preview`, { sourceUrl }),

  generate: (payload) => call('POST', `${BASE}/generate`, payload),

  createJob: (payload) => call('POST', `${BASE}/jobs`, payload),

  generateJob: (jobId) => call('POST', `${BASE}/jobs/${encodeURIComponent(jobId)}/generate`, {}),

  patchJob: (jobId, body) => call('PATCH', `${BASE}/jobs/${encodeURIComponent(jobId)}`, body),

  publishJob: (jobId, body = {}) => call('POST', `${BASE}/jobs/${encodeURIComponent(jobId)}/publish`, body),

  listJobs: (params = {}) => {
    const q = new URLSearchParams()
    if (params.status) q.set('status', params.status)
    if (params.page) q.set('page', String(params.page))
    if (params.pageSize) q.set('pageSize', String(params.pageSize))
    const qs = q.toString()
    return apiClient.get(`${BASE}/jobs${qs ? `?${qs}` : ''}`)
  },

  getJob: (jobId) => call('GET', `${BASE}/jobs/${encodeURIComponent(jobId)}`),

  deleteJob: (jobId) => call('DELETE', `${BASE}/jobs/${encodeURIComponent(jobId)}`),
}

export default syndicationApi
