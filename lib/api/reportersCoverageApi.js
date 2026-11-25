import { getToken } from '../../utils/auth'

function getApiBase() {
  if (typeof window !== 'undefined') return '/api/proxy'
  const raw = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://api.kaburlumedia.com'
  const base = String(raw || '').replace(/\/+$/, '')
  const collapsed = base.replace(/(\/api\/v1)+$/, '/api/v1')
  return collapsed.endsWith('/api/v1') ? collapsed : `${collapsed}/api/v1`
}

/**
 * GET /reporters/coverage?tenantId=...
 * @param {{ tenantId?: string | null, stateId?: string | null }} params
 */
export async function fetchReportersCoverage(params = {}) {
  const t = getToken()
  const qs = new URLSearchParams()
  if (params.tenantId) qs.set('tenantId', params.tenantId)
  if (params.stateId) qs.set('stateId', params.stateId)
  const q = qs.toString()
  const url = `${getApiBase()}/reporters/coverage${q ? `?${q}` : ''}`
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${t?.token || ''}`,
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || data.message || `Coverage fetch failed (${res.status})`)
  return data
}