/**
 * API Client - Model Layer (MVP Pattern)
 * Handles all HTTP requests with consistent error handling and auth
 * Uses local proxy to bypass CORS issues
 */

import { getToken } from '../../utils/auth'

// Use local proxy to avoid CORS issues
const getApiBase = () => {
  // Check if running in browser - use proxy
  if (typeof window !== 'undefined') {
    return '/api/proxy'
  }
  // Server-side can call backend directly
  const base = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com'
  return String(base).replace(/\/$/, '') + '/api/v1'
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
    
    // Debug: log token status (remove in production)
    if (typeof window !== 'undefined') {
      console.log('[Auth Debug]', {
        hasToken: !!token,
        tokenPreview: token?.token ? `${token.token.substring(0, 20)}...` : 'none',
        authHeader: authHeader ? 'Bearer token set' : 'No auth header'
      })
    }
    
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': authHeader
    }
  },

  async request(endpoint, options = {}) {
    const baseUrl = getApiBase()
    const url = `${baseUrl}${endpoint}`
    const headers = {
      ...this.getAuthHeaders(),
      ...options.headers
    }
    const config = {
      ...options,
      headers
    }

    // 🔍 DEBUG: Log full request details
    if (typeof window !== 'undefined') {
      console.group('🚀 API Request')
      console.log('📍 Base URL:', baseUrl)
      console.log('📍 Endpoint:', endpoint)
      console.log('📍 Full URL:', url)
      console.log('📍 Method:', config.method || 'GET')
      console.log('📍 Headers:', headers)
      if (config.body) {
        try {
          console.log('📦 Payload:', JSON.parse(config.body))
        } catch {
          console.log('📦 Payload (raw):', config.body)
        }
      }
      console.groupEnd()
    }

    try {
      const response = await fetch(url, config)

      // 🔍 DEBUG: Log response status
      if (typeof window !== 'undefined') {
        console.log(`📬 Response: ${response.status} ${response.statusText} for ${endpoint}`)
      }

      if (!response.ok) {
        const message = await parseErrorResponse(response)
        console.error(`❌ API Error: ${response.status} - ${message}`)
        throw new ApiError(message, response.status)
      }

      // Handle empty responses
      const text = await response.text()
      if (!text) return null

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
  }
}

export default apiClient
