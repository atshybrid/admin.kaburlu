/**
 * Languages API Service
 * Handles fetching languages for tenant entity configuration
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

export const languagesApi = {
  /**
   * GET /languages
   * Returns list of all languages
   */
  list: async () => {
    const response = await request('/api/v1/languages')
    console.log('Languages API response:', response)
    // API returns { success: true, data: [...] } or just data array
    if (response.success && response.data) {
      return response.data
    }
    // If response is already an array, return it
    if (Array.isArray(response)) {
      return response
    }
    return []
  },
}
