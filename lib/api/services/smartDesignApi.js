/**
 * ePaper Smart Design API client (proxied via /api/admin/epaper/smart-design/*)
 */
import { getToken } from '../../../utils/auth'

function getBase() {
  // Browser: proxy to production /api/v1/epaper/smart-design (same as Swagger curl).
  if (typeof window !== 'undefined') return '/api/admin/proxy/epaper/smart-design'
  const raw = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE || ''
  const clean = String(raw).replace(/\/$/, '')
  if (!clean) return '/api/admin/epaper/smart-design'
  const root = /\/api\//i.test(clean) ? clean : `${clean}/api/v1`
  return `${root}/epaper/smart-design`
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
  const qs = q.toString()
  const url = `${getBase()}${path.startsWith('/') ? path : `/${path}`}${qs ? `?${qs}` : ''}`
  const res = await fetch(url, {
    method,
    headers: headers(tenantId, !(body instanceof FormData)),
    ...(body !== undefined ? { body: body instanceof FormData ? body : JSON.stringify(body) } : {}),
  })
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { raw: text }
  }
  if (!res.ok) {
    const msg = data?.error || data?.message || text || `HTTP ${res.status}`
    const err = new Error(typeof msg === 'string' ? msg : JSON.stringify(msg))
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

export const smartDesignApi = {
  getHeaderStyles: (tenantId) => request('/header-styles', { tenantId }),

  getContext: (tenantId, query = {}) => request('/context', { tenantId, query }),

  /** All editions + nested designs in one call */
  getEditions: (tenantId) => request('/editions', { tenantId }),

  /** Single edition/sub-edition scope — returns exists, nextAction, design */
  getByEdition: (tenantId, query = {}) => request('/by-edition', { tenantId, query }),

  list: (tenantId, query = {}) => request('', { tenantId, query }),

  getById: (tenantId, id) => request(`/${encodeURIComponent(id)}`, { tenantId }),

  create: (tenantId, body) => request('', { tenantId, method: 'POST', body }),

  replace: (tenantId, id, body) => request(`/${encodeURIComponent(id)}`, { tenantId, method: 'PUT', body }),

  patch: (tenantId, id, body) => request(`/${encodeURIComponent(id)}`, { tenantId, method: 'PATCH', body }),

  remove: (tenantId, id) => request(`/${encodeURIComponent(id)}`, { tenantId, method: 'DELETE' }),

  /**
   * POST-close window news pool for inner pages (P2+).
   * excludeMainPage=true keeps P1 for manual hero layout.
   */
  collectNews: (tenantId, query = {}) => request('/collect-news', { tenantId, query }),
}

export default smartDesignApi
