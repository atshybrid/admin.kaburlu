/**
 * API Client - Model Layer (MVP Pattern)
 * Handles all HTTP requests with consistent error handling and auth
 * Uses local proxy to bypass CORS issues
 */

import { getToken } from '../../utils/auth'

function ensureApiV1Base(rawBase) {
  const base = String(rawBase || '').replace(/\/+$/, '')
  // Collapse any accidental duplicate suffixes, then ensure exactly one /api/v1
  const collapsed = base.replace(/(\/api\/v1)+$/, '/api/v1')
  return collapsed.endsWith('/api/v1') ? collapsed : `${collapsed}/api/v1`
}

// Use local proxy in browser to bypass CORS.
// On server-side, call backend directly.
const getApiBase = () => {
  if (typeof window !== 'undefined') return '/api/proxy'
  const raw = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com'
  return ensureApiV1Base(raw)
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
        console.group(`📬 API Response: ${response.status} ${response.statusText}`)
        console.log('📍 URL:', url)
        console.log('📊 Status:', response.status)
      }

      if (!response.ok) {
        const message = await parseErrorResponse(response)
        if (typeof window !== 'undefined') {
          console.error('❌ Error Message:', message)
          console.groupEnd()
        }
        throw new ApiError(message, response.status)
      }

      // Handle empty responses
      const text = await response.text()
      if (!text) {
        if (typeof window !== 'undefined') {
          console.log('✅ Response: Empty (204 No Content)')
          console.groupEnd()
        }
        return null
      }

      const data = JSON.parse(text)
      
      // 🔍 DEBUG: Log response data
      if (typeof window !== 'undefined') {
        console.log('✅ Response Data:', data)
        console.groupEnd()
      }

      return data
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
    const baseUrl = getApiBase()
    const url = `${baseUrl}${endpoint}`
    const token = getToken()
    
    const headers = {}
    if (token?.token) {
      headers['Authorization'] = `Bearer ${token.token}`
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData
      })

      if (!response.ok) {
        const message = await parseErrorResponse(response)
        throw new ApiError(message, response.status)
      }

      const text = await response.text()
      if (!text) return null
      return JSON.parse(text)
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError(error.message || 'Upload failed', 0)
    }
  }
}

export default apiClient
