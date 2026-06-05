import { getToken } from '../../../utils/auth'

function getApiBase() {
  if (typeof window !== 'undefined') return '/api/admin/epaper'
  const raw = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://api.kaburlumedia.com'
  const clean = String(raw).replace(/\/$/, '')
  return /\/api\//i.test(clean) ? `${clean}/epaper` : `${clean}/api/v1/epaper`
}

function getAuthHeaders(tenantId, extra = {}) {
  const token = getToken()?.token
  return {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(tenantId ? { 'X-Tenant-Id': String(tenantId) } : {}),
    ...extra,
  }
}

async function request(path, { tenantId, method = 'GET', body, headers = {} } = {}) {
  const url = `${getApiBase()}${path.startsWith('/') ? path : `/${path}`}`
  const res = await fetch(url, {
    method,
    headers: {
      ...getAuthHeaders(tenantId, body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
    ...(typeof body === 'undefined' ? {} : { body: body instanceof FormData ? body : JSON.stringify(body) }),
  })
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text || null
  }
  if (!res.ok) {
    const message = data?.message || data?.error || text || `Request failed: ${res.status}`
    throw new Error(message)
  }
  return data
}

export { smartDesignApi } from './smartDesignApi'

export const epaperAdminApi = {
  getSettings: (tenantId) => request('/settings', { tenantId }),
  initializeSettings: (tenantId) => request('/settings/initialize', { tenantId, method: 'POST' }),
  updateSettings: (tenantId, payload) => request('/settings', { tenantId, method: 'PUT', body: payload }),

  getDesignConfig: (tenantId) => request('/design-config', { tenantId }),
  upsertDesignConfig: (tenantId, payload, method = 'POST') =>
    request('/design-config', { tenantId, method, body: payload }),
  patchDesignConfig: (tenantId, payload) => request('/design-config', { tenantId, method: 'PATCH', body: payload }),

  listIssueEntries: (tenantId, year) =>
    request(`/design-config/issues${year ? `?year=${encodeURIComponent(year)}` : ''}`, { tenantId }),
  createIssueEntry: (tenantId, payload) =>
    request('/design-config/issues', { tenantId, method: 'POST', body: payload }),
  updateIssueEntry: (tenantId, issueDate, payload, method = 'PUT') =>
    request(`/design-config/issues/${encodeURIComponent(issueDate)}`, { tenantId, method, body: payload }),
  deleteIssueEntry: (tenantId, issueDate) =>
    request(`/design-config/issues/${encodeURIComponent(issueDate)}`, { tenantId, method: 'DELETE' }),

  listPublicationEditions: (tenantId, includeSubEditions = true) =>
    request(`/publication-editions?includeSubEditions=${includeSubEditions ? 'true' : 'false'}`, { tenantId }),
  createPublicationEdition: (tenantId, payload) =>
    request('/publication-editions', { tenantId, method: 'POST', body: payload }),
  updatePublicationEdition: (tenantId, editionId, payload) =>
    request(`/publication-editions/${encodeURIComponent(editionId)}`, { tenantId, method: 'PUT', body: payload }),
  deletePublicationEdition: (tenantId, editionId) =>
    request(`/publication-editions/${encodeURIComponent(editionId)}`, { tenantId, method: 'DELETE' }),

  listSubEditions: (tenantId, editionId) =>
    request(`/publication-editions/${encodeURIComponent(editionId)}/sub-editions`, { tenantId }),
  createSubEdition: (tenantId, editionId, payload) =>
    request(`/publication-editions/${encodeURIComponent(editionId)}/sub-editions`, {
      tenantId,
      method: 'POST',
      body: payload,
    }),
  updateSubEdition: (tenantId, editionId, subEditionId, payload) =>
    request(`/publication-editions/${encodeURIComponent(editionId)}/sub-editions/${encodeURIComponent(subEditionId)}`, {
      tenantId,
      method: 'PUT',
      body: payload,
    }),
  deleteSubEdition: (tenantId, editionId, subEditionId) =>
    request(`/publication-editions/${encodeURIComponent(editionId)}/sub-editions/${encodeURIComponent(subEditionId)}`, {
      tenantId,
      method: 'DELETE',
    }),
}

export default epaperAdminApi
