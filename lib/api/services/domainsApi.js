import { getToken } from '../../../utils/auth'

function getApiBase() {
  if (typeof window !== 'undefined') {
    return '/api/proxy'
  }
  return (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://app.kaburlumedia.com').replace(/\/$/, '') + '/api/v1'
}

async function request(path, options = {}) {
  const t = getToken()
  
  const res = await fetch(`${getApiBase()}${path}`, {
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

export const domainsApi = {
  // Get all domains for a specific tenant
  list: async (tenantId) => {
    const response = await request(`/domains/${tenantId}`)
    return Array.isArray(response) ? response : (response?.data || [])
  },

  // Create domain for tenant
  create: async (tenantId, domainData) => {
    const response = await request(`/tenants/${tenantId}/domains`, {
      method: 'POST',
      body: JSON.stringify(domainData)
    })
    return response
  },

  // Verify domain
  verify: async (domainId, verificationData) => {
    const response = await request(`/domains/${domainId}/verify`, {
      method: 'POST',
      body: JSON.stringify(verificationData)
    })
    return response
  },

  // Change domain kind (NEWS/EPAPER)
  updateKind: async (domainId, kind) => {
    const response = await request(`/domains/${domainId}/kind`, {
      method: 'PATCH',
      body: JSON.stringify({ kind })
    })
    return response
  },

  // Delete domain
  delete: async (domainId) => {
    const response = await request(`/domains/${domainId}`, {
      method: 'DELETE'
    })
    return response
  }
}
