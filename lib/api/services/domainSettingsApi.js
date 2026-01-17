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

export const domainSettingsApi = {
  // Get domain settings
  get: async (tenantId, domainId) => {
    return await request(`/tenants/${tenantId}/domains/${domainId}/settings`)
  },

  // Update domain settings (partial)
  update: async (tenantId, domainId, settings) => {
    return await request(`/tenants/${tenantId}/domains/${domainId}/settings`, {
      method: 'PATCH',
      body: JSON.stringify(settings)
    })
  },

  // Replace all domain settings
  replace: async (tenantId, domainId, settings) => {
    return await request(`/tenants/${tenantId}/domains/${domainId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings)
    })
  },

  // List all domain settings for tenant
  listAll: async (tenantId, page = 1, pageSize = 20) => {
    return await request(`/tenants/${tenantId}/domains/settings?page=${page}&pageSize=${pageSize}`)
  }
}
