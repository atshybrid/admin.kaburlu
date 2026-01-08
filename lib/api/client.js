/**
 * API Client - Model Layer (MVP Pattern)
 * Handles all HTTP requests with consistent error handling and auth
 */

import { getToken } from '../../utils/auth'

const getApiBase = () => {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com'
  return String(base).replace(/\/$/, '')
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
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': token?.token ? `Bearer ${token.token}` : ''
    }
  },

  async request(endpoint, options = {}) {
    const url = `${getApiBase()}${endpoint}`
    const config = {
      headers: this.getAuthHeaders(),
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers
      }
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        const message = await parseErrorResponse(response)
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
