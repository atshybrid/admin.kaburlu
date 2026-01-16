/**
 * States API Service
 * Handles fetching states for dropdowns and location data
 */
import { getToken } from '../../../utils/auth'

function getApiBase() {
  if (typeof window !== 'undefined') {
    return '/api/proxy'
  }
  return (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://app.kaburlumedia.com').replace(/\/$/, '') + '/api/v1'
}

async function request(path, options = {}) {
  const t = getToken()
  const baseUrl = getApiBase()
  const cleanPath = path.replace(/^\/api\/v1/, '')
  const url = `${baseUrl}${cleanPath}`
  
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${t?.token || ''}`,
      ...options.headers,
    },
  })
  
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || data.error || `Request failed: ${res.status}`)
  }
  
  return res.json()
}

export const statesApi = {
  /**
   * GET /states
   * Returns list of all states
   */
  list: async () => {
    const response = await request('/api/v1/states')
    // API returns { success: true, data: [...] }
    return response.success ? response.data : response
  },
}
