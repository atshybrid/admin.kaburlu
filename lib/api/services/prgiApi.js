/**
 * PRGI (Press Registration) API Service
 * Handles PRGI status and actions (submit, verify, reject)
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

export const prgiApi = {
  /**
   * GET /prgi/:tenantId
   * Get PRGI status for a tenant
   */
  getStatus: (tenantId) => request(`/prgi/${tenantId}`),
  
  /**
   * POST /prgi/:tenantId/submit
   * Submit PRGI for verification
   */
  submit: (tenantId) => request(`/prgi/${tenantId}/submit`, {
    method: 'POST',
  }),
  
  /**
   * POST /prgi/:tenantId/verify
   * Verify/Approve PRGI
   */
  verify: (tenantId) => request(`/prgi/${tenantId}/verify`, {
    method: 'POST',
  }),
  
  /**
   * POST /prgi/:tenantId/reject
   * Reject PRGI with optional reason
   */
  reject: (tenantId, reason = '') => request(`/prgi/${tenantId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  }),
}
