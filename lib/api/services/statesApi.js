/**
 * States API Service
 * Handles fetching states for dropdowns and location data
 */
import { getToken } from '../../../utils/auth'

function getApiBase() {
  // Direct backend URL
  return (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com').replace(/\/$/, '')
}

async function request(path, options = {}) {
  const t = getToken()
  const baseUrl = getApiBase()
  const url = `${baseUrl}${path}`
  
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
    const response = await request('/states')
    // API returns { success: true, data: [...] }
    return response.success ? response.data : response
  },
}
