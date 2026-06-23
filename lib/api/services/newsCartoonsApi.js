/**
 * Short News Cartoons — Platform Admin API
 * Base: /api/v1/platform/news-cartoons
 */
import { apiClient } from '../client'

const BASE = '/platform/news-cartoons'

export function extractCartoonImageUrl(data) {
  if (!data || typeof data !== 'object') return ''
  return (
    data.imageUrl ||
    data.publicUrl ||
    data.url ||
    data.fileUrl ||
    data.data?.imageUrl ||
    data.data?.url ||
    ''
  )
}

export const newsCartoonsApi = {
  /** POST /platform/news-cartoons/upload */
  upload: async (file) => {
    const fd = new FormData()
    fd.append('file', file)

    const uploadUrl =
      typeof window !== 'undefined'
        ? '/api/admin/news-cartoons/upload'
        : `${apiClient.getBaseUrl()}${BASE}/upload`

    let data

    if (typeof window !== 'undefined') {
      const { getToken } = await import('../../../utils/auth')
      const t = getToken()
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: t?.token ? { Authorization: `Bearer ${t.token}` } : {},
        body: fd,
      })
      const text = await res.text()
      data = text ? JSON.parse(text) : null
      if (!res.ok) {
        const msg = data?.message || data?.error || text || `Upload failed: ${res.status}`
        throw new Error(msg)
      }
    } else {
      data = await apiClient.upload(`${BASE}/upload`, fd)
    }

    return { url: extractCartoonImageUrl(data), raw: data }
  },

  /** POST /platform/news-cartoons/seo/generate */
  generateSeo: (body) => apiClient.post(`${BASE}/seo/generate`, body),

  /** GET /platform/news-cartoons */
  list: (params = {}) => apiClient.get(BASE, params),

  /** GET /platform/news-cartoons/:id */
  get: (id) => apiClient.get(`${BASE}/${encodeURIComponent(id)}`),

  /** POST /platform/news-cartoons */
  create: (body) => apiClient.post(BASE, body),

  /** PATCH /platform/news-cartoons/:id */
  patch: (id, body) => apiClient.patch(`${BASE}/${encodeURIComponent(id)}`, body),

  /** DELETE /platform/news-cartoons/:id */
  remove: (id) => apiClient.delete(`${BASE}/${encodeURIComponent(id)}`),
}

export default newsCartoonsApi
