/**
 * News Banners — Super Admin API
 * Base: /api/v1/admin/news-banners
 */
import { apiClient } from '../client'

const BASE = '/admin/news-banners'

export function extractBannerMediaUrl(data) {
  if (!data || typeof data !== 'object') return ''
  return (
    data.mediaUrl ||
    data.publicUrl ||
    data.url ||
    data.fileUrl ||
    data.data?.mediaUrl ||
    data.data?.url ||
    ''
  )
}

export const newsBannersApi = {
  /** POST /admin/news-banners/upload — multipart → Bunny CDN (via local proxy in browser) */
  upload: async (file) => {
    const fd = new FormData()
    fd.append('file', file)

    const uploadUrl =
      typeof window !== 'undefined'
        ? '/api/admin/news-banners/upload'
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

    return { url: extractBannerMediaUrl(data), raw: data }
  },

  /** POST /admin/news-banners */
  create: (body) => apiClient.post(BASE, body),

  /** GET /admin/news-banners */
  list: (params = {}) => apiClient.get(BASE, params),

  /** GET /admin/news-banners/:id */
  get: (id) => apiClient.get(`${BASE}/${encodeURIComponent(id)}`),

  /** PUT /admin/news-banners/:id */
  replace: (id, body) => apiClient.put(`${BASE}/${encodeURIComponent(id)}`, body),

  /** PATCH /admin/news-banners/:id */
  patch: (id, body) => apiClient.patch(`${BASE}/${encodeURIComponent(id)}`, body),

  /** DELETE /admin/news-banners/:id */
  remove: (id) => apiClient.delete(`${BASE}/${encodeURIComponent(id)}`),
}

export default newsBannersApi
