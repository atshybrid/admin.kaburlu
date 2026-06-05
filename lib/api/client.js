/**
 * API Client - Model Layer (MVP Pattern)
 * Handles all HTTP requests with consistent error handling and auth
 * Uses local proxy to bypass CORS issues
 */

import { getToken } from '../../utils/auth'

/**
 * Normalize base URL - ensures exactly one /api/v1 suffix
 * Handles cases where URL might have /api/v1 twice or not at all
 */
function normalizeBaseUrl(rawUrl) {
  if (!rawUrl) return 'https://app.kaburlumedia.com/api/v1'
  
  let url = String(rawUrl).trim()
  
  // Remove trailing slashes
  url = url.replace(/\/+$/, '')
  
  // Remove all occurrences of /api/v1 from the end (handles duplicates)
  while (url.endsWith('/api/v1')) {
    url = url.slice(0, -7) // Remove '/api/v1' (7 chars)
  }
  
  // Add exactly one /api/v1
  return `${url}/api/v1`
}

/**
 * Normalize endpoint - ensures it starts with / and doesn't have /api/v1 prefix
 */
function normalizeEndpoint(endpoint) {
  if (!endpoint) return ''
  
  let ep = String(endpoint).trim()
  
  // Remove /api/v1 prefix if present (avoid duplication)
  ep = ep.replace(/^\/?(api\/v1\/?)?/, '')
  
  // Ensure starts with /
  return ep.startsWith('/') ? ep : `/${ep}`
}

// Use local proxy in browser to bypass CORS.
// On server-side, call backend directly.
const getApiBase = () => {
  if (typeof window !== 'undefined') return '/api/proxy'
  const raw = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com'
  return normalizeBaseUrl(raw)
}

/**
 * Get direct backend URL for uploads (bypasses proxy)
 */
const getDirectBackendUrl = () => {
  const raw = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com'
  return normalizeBaseUrl(raw)
}

export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

async function parseErrorResponse(res) {
  try {
    const data = await res.json()
    return (
      data?.message ||
      data?.error ||
      data?.errors?.[0]?.message ||
      data?.data?.message ||
      JSON.stringify(data)
    )
  } catch {
    try {
      const text = await res.text()
      return text || `Request failed: ${res.status}`
    } catch {
      return `Request failed: ${res.status}`
    }
  }
}

/**
 * Core API client with authentication and error handling
 */
export const apiClient = {
  getBaseUrl: getApiBase,

  getAuthHeaders() {
    const token = getToken()
    const authHeader = token?.token ? `Bearer ${token.token}` : ''
    
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': authHeader
    }
  },

  async request(endpoint, options = {}) {
    const baseUrl = getApiBase()
    const normalizedEndpoint = normalizeEndpoint(endpoint)
    const url = `${baseUrl}${normalizedEndpoint}`
    const headers = {
      ...this.getAuthHeaders(),
      ...options.headers
    }
    const config = {
      ...options,
      headers
    }

    try {
      const response = await fetch(url, config)

      const text = await response.text()

      if (!response.ok) {
        let data = null
        try {
          data = text ? JSON.parse(text) : null
        } catch {
          data = null
        }
        const message =
          data?.message ||
          data?.error ||
          data?.errors?.[0]?.message ||
          data?.data?.message ||
          text ||
          `Request failed: ${response.status}`
        throw new ApiError(message, response.status, data)
      }

      if (!text) {
        return null
      }

      return JSON.parse(text)
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError(error.message || 'Network error', 0)
    }
  },

  async get(endpoint, params = {}) {
    const searchParams = new URLSearchParams(params)
    const queryString = searchParams.toString()
    const url = queryString ? `${endpoint}?${queryString}` : endpoint
    return this.request(url, { method: 'GET' })
  },

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  async patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  },

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' })
  },

  async upload(endpoint, formData) {
    // For file uploads, we MUST call the backend directly (not through proxy)
    // because the proxy doesn't support multipart/form-data
    const backendBase = getDirectBackendUrl()
    const normalizedEndpoint = normalizeEndpoint(endpoint)
    const url = `${backendBase}${normalizedEndpoint}`
    const token = getToken()
    
    const headers = {}
    if (token?.token) {
      headers['Authorization'] = `Bearer ${token.token}`
    }
    // Don't set Content-Type - browser will set it with boundary for FormData

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData
      })

      const text = await response.text()
      let data = null
      if (text) {
        try {
          data = JSON.parse(text)
        } catch {
          data = { message: text }
        }
      }

      if (!response.ok) {
        const message =
          data?.message ||
          data?.error ||
          `Request failed: ${response.status}`
        throw new ApiError(message, response.status, data)
      }

      return data
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError(error.message || 'Upload failed', 0)
    }
  }
}

export default apiClient
