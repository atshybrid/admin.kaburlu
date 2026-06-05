/**
 * ePaper config API (proxied via /api/admin/epaper/*)
 */
import { getToken } from '../../../utils/auth'

function epaperBase() {
  if (typeof window !== 'undefined') return '/api/admin/epaper'
  const raw = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE || ''
  const clean = String(raw).replace(/\/$/, '')
  const root = /\/api\//i.test(clean) ? clean : `${clean}/api/v1`
  return `${root}/epaper`
}

function headers(tenantId, json = true) {
  const token = getToken()?.token
  return {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(tenantId ? { 'X-Tenant-Id': String(tenantId) } : {}),
    ...(json ? { 'Content-Type': 'application/json' } : {}),
  }
}

async function request(path, { tenantId, method = 'GET', body, query } = {}) {
  const q = new URLSearchParams()
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.set(k, String(v))
    })
  }
  if (tenantId) q.set('tenantId', String(tenantId))
  const qs = q.toString()
  const url = `${epaperBase()}${path.startsWith('/') ? path : `/${path}`}${qs ? `?${qs}` : ''}`
  const res = await fetch(url, {
    method,
    headers: headers(tenantId, !(body instanceof FormData)),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { raw: text }
  }
  if (!res.ok) {
    const err = new Error(data?.error || data?.message || text || `HTTP ${res.status}`)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

export const epaperApi = {
  getPaperPageSpecs: () => request('/paper-page-specs'),

  getHeaderStyles: () => request('/header-styles'),

  getNewspaperConfig: (tenantId) => request('/newspaper-config', { tenantId }),

  putNewspaperConfig: (tenantId, body) =>
    request('/newspaper-config', { tenantId, method: 'PUT', body }),

  getSettings: (tenantId) => request('/settings', { tenantId }),
}

export default epaperApi
