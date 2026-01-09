/**
 * Tenant API Service - Complete API integration for tenant management
 * Covers all endpoints from tenants.routes.ts, domains.routes.ts, settings.routes.ts,
 * tenantTheme.routes.ts, tenantAds.routes.ts
 */
import { getToken } from '../../utils/auth'

function getApiBase() {
  return (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com').replace(/\/$/, '')
}

async function request(path, options = {}) {
  const t = getToken()
  const url = `${getApiBase()}${path}`
  
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

// ============================================
// 1) TENANTS CRUD
// ============================================
export const tenantsApi = {
  /** GET /tenants?full=true|false */
  list: (full = true) => request(`/api/v1/tenants?full=${full}`),
  
  /** GET /tenants/:id */
  get: (id) => request(`/api/v1/tenants/${id}`),
  
  /** POST /tenants (SUPER_ADMIN) */
  create: (payload) => request('/api/v1/tenants', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  
  /** PATCH /tenants/:id (SUPER_ADMIN) */
  update: (id, payload) => request(`/api/v1/tenants/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
}

// ============================================
// 2) TENANT ENTITY (PRGI / Publisher details)
// ============================================
export const entityApi = {
  /** GET /tenants/:tenantId/entity */
  get: (tenantId) => request(`/api/v1/tenants/${tenantId}/entity`),
  
  /** POST /tenants/:tenantId/entity (upsert) */
  create: (tenantId, payload) => request(`/api/v1/tenants/${tenantId}/entity`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  
  /** POST /tenants/:tenantId/entity/simple */
  createSimple: (tenantId, payload) => request(`/api/v1/tenants/${tenantId}/entity/simple`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  
  /** PUT /tenants/:tenantId/entity */
  update: (tenantId, payload) => request(`/api/v1/tenants/${tenantId}/entity`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  
  /** PUT /tenants/:tenantId/entity/business */
  updateBusiness: (tenantId, payload) => request(`/api/v1/tenants/${tenantId}/entity/business`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  
  /** PATCH /tenants/:tenantId/entity/native-name */
  updateNativeName: (tenantId, nativeName) => request(`/api/v1/tenants/${tenantId}/entity/native-name`, {
    method: 'PATCH',
    body: JSON.stringify({ nativeName }),
  }),
}

// ============================================
// 3) TENANT DOMAINS
// ============================================
export const domainsApi = {
  /** GET /domains (global list) */
  list: () => request('/api/v1/domains'),
  
  /** POST /tenants/:tenantId/domains */
  create: (tenantId, payload) => request(`/api/v1/tenants/${tenantId}/domains`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  
  /** POST /domains/:id/verify (SUPER_ADMIN) */
  verify: (domainId, payload = { method: 'MANUAL', force: false }) => 
    request(`/api/v1/domains/${domainId}/verify`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  
  /** PATCH /domains/:id/kind (SUPER_ADMIN) */
  setKind: (domainId, kind) => request(`/api/v1/domains/${domainId}/kind`, {
    method: 'PATCH',
    body: JSON.stringify({ kind }),
  }),
  
  /** PUT /domains/:id/categories (SUPER_ADMIN) */
  setCategories: (domainId, payload) => request(`/api/v1/domains/${domainId}/categories`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  
  /** DELETE /tenants/:tenantId/domains/:domainId */
  delete: (tenantId, domainId) => request(`/api/v1/tenants/${tenantId}/domains/${domainId}`, {
    method: 'DELETE',
  }),
}

// ============================================
// 4) TENANT CATEGORIES
// ============================================
export const categoriesApi = {
  /** GET /tenants/:tenantId/categories */
  list: (tenantId, { includeTranslation = true, domainId } = {}) => {
    const params = new URLSearchParams({ includeTranslation })
    if (domainId) params.append('domainId', domainId)
    return request(`/api/v1/tenants/${tenantId}/categories?${params}`)
  },
  
  /** GET /categories (global) */
  listAll: () => request('/api/v1/categories'),
}

// ============================================
// 5) SETTINGS (Entity/Tenant/Domain layering)
// ============================================
export const settingsApi = {
  // Entity defaults (SUPER_ADMIN)
  entity: {
    get: () => request('/api/v1/entity/settings'),
    put: (settings) => request('/api/v1/entity/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
    patch: (settings) => request('/api/v1/entity/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    }),
  },
  
  // Tenant settings (SUPER_ADMIN)
  tenant: {
    get: (tenantId) => request(`/api/v1/tenants/${tenantId}/settings`),
    put: (tenantId, settings) => request(`/api/v1/tenants/${tenantId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
    patch: (tenantId, settings) => request(`/api/v1/tenants/${tenantId}/settings`, {
      method: 'PATCH',
      body: JSON.stringify(settings),
    }),
  },
  
  // Domain settings (SUPER_ADMIN)
  domain: {
    get: (tenantId, domainId) => request(`/api/v1/tenants/${tenantId}/domains/${domainId}/settings`),
    put: (tenantId, domainId, settings) => request(`/api/v1/tenants/${tenantId}/domains/${domainId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
    patch: (tenantId, domainId, settings) => request(`/api/v1/tenants/${tenantId}/domains/${domainId}/settings`, {
      method: 'PATCH',
      body: JSON.stringify(settings),
    }),
    list: (tenantId, { page = 1, pageSize = 20 } = {}) => 
      request(`/api/v1/tenants/${tenantId}/domains/settings?page=${page}&pageSize=${pageSize}`),
  },
}

// ============================================
// 6) TENANT THEME + HOMEPAGE CONFIG
// ============================================
export const themeApi = {
  /** GET /tenant-theme/:tenantId */
  get: (tenantId) => request(`/api/v1/tenant-theme/${tenantId}`),
  
  /** PATCH /tenant-theme/:tenantId (upsert) */
  update: (tenantId, payload) => request(`/api/v1/tenant-theme/${tenantId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
  
  // Homepage config
  homepage: {
    /** GET /tenant-theme/:tenantId/homepage/:style */
    get: (tenantId, style) => request(`/api/v1/tenant-theme/${tenantId}/homepage/${style}`),
    
    /** GET /tenant-theme/:tenantId/homepage/:style/default */
    getDefault: (tenantId, style) => request(`/api/v1/tenant-theme/${tenantId}/homepage/${style}/default`),
    
    /** POST /tenant-theme/:tenantId/homepage/:style/apply-default */
    applyDefault: (tenantId, style) => request(`/api/v1/tenant-theme/${tenantId}/homepage/${style}/apply-default`, {
      method: 'POST',
    }),
    
    /** PATCH /tenant-theme/:tenantId/homepage/:style/sections */
    updateSections: (tenantId, style, sections) => request(`/api/v1/tenant-theme/${tenantId}/homepage/${style}/sections`, {
      method: 'PATCH',
      body: JSON.stringify({ sections }),
    }),
    
    // Style2 v2 helpers
    style2v2: {
      get: (tenantId) => request(`/api/v1/tenant-theme/${tenantId}/homepage/style2/v2`),
      applyDefault: (tenantId) => request(`/api/v1/tenant-theme/${tenantId}/homepage/style2/v2/apply-default`, {
        method: 'POST',
      }),
      updateSections: (tenantId, sections) => request(`/api/v1/tenant-theme/${tenantId}/homepage/style2/v2/sections`, {
        method: 'PATCH',
        body: JSON.stringify({ sections }),
      }),
    },
  },
}

// ============================================
// 7) TENANT ADS
// ============================================
export const adsApi = {
  /** GET /tenants/:tenantId/ads */
  list: (tenantId) => request(`/api/v1/tenants/${tenantId}/ads`),
  
  /** POST /tenants/:tenantId/ads */
  create: (tenantId, payload) => request(`/api/v1/tenants/${tenantId}/ads`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  
  /** PATCH /tenants/:tenantId/ads/:adId */
  update: (tenantId, adId, payload) => request(`/api/v1/tenants/${tenantId}/ads/${adId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
  
  /** DELETE /tenants/:tenantId/ads/:adId */
  delete: (tenantId, adId) => request(`/api/v1/tenants/${tenantId}/ads/${adId}`, {
    method: 'DELETE',
  }),
  
  // Slot-based ads config
  style1: {
    get: (tenantId) => request(`/api/v1/tenants/${tenantId}/ads/style1`),
    put: (tenantId, ads) => request(`/api/v1/tenants/${tenantId}/ads/style1`, {
      method: 'PUT',
      body: JSON.stringify(ads),
    }),
    patch: (tenantId, ads) => request(`/api/v1/tenants/${tenantId}/ads/style1`, {
      method: 'PATCH',
      body: JSON.stringify(ads),
    }),
  },
  
  style2: {
    get: (tenantId) => request(`/api/v1/tenants/${tenantId}/ads/style2`),
    put: (tenantId, ads) => request(`/api/v1/tenants/${tenantId}/ads/style2`, {
      method: 'PUT',
      body: JSON.stringify(ads),
    }),
    patch: (tenantId, ads) => request(`/api/v1/tenants/${tenantId}/ads/style2`, {
      method: 'PATCH',
      body: JSON.stringify(ads),
    }),
  },
}

// ============================================
// 8) FEATURE FLAGS
// ============================================
export const featureFlagsApi = {
  /** GET /tenants/:tenantId/feature-flags */
  get: (tenantId) => request(`/api/v1/tenants/${tenantId}/feature-flags`),
  
  /** PATCH /tenants/:tenantId/feature-flags */
  patch: (tenantId, flags) => request(`/api/v1/tenants/${tenantId}/feature-flags`, {
    method: 'PATCH',
    body: JSON.stringify(flags),
  }),
}

// ============================================
// 9) RAZORPAY CONFIG
// ============================================
export const razorpayApi = {
  /** GET /tenants/razorpay-configs?... (SUPER_ADMIN list all) */
  listAll: ({ page = 1, pageSize = 50, active, tenantName } = {}) => {
    const params = new URLSearchParams({ page, pageSize })
    if (active !== undefined) params.append('active', active)
    if (tenantName) params.append('tenantName', tenantName)
    return request(`/api/v1/tenants/razorpay-configs?${params}`)
  },
  
  /** GET /tenants/:tenantId/razorpay-config */
  get: (tenantId) => request(`/api/v1/tenants/${tenantId}/razorpay-config`),
  
  /** POST /tenants/:tenantId/razorpay-config (create, fails 409 if exists) */
  create: (tenantId, payload) => request(`/api/v1/tenants/${tenantId}/razorpay-config`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  
  /** PUT /tenants/:tenantId/razorpay-config (upsert) */
  upsert: (tenantId, payload) => request(`/api/v1/tenants/${tenantId}/razorpay-config`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
}

// ============================================
// 10) ID CARD SETTINGS
// ============================================
export const idCardApi = {
  /** GET /tenants/id-card-settings (SUPER_ADMIN list all) */
  listAll: ({ page = 1, pageSize = 50 } = {}) => 
    request(`/api/v1/tenants/id-card-settings?page=${page}&pageSize=${pageSize}`),
  
  /** GET /tenants/:tenantId/id-card-settings */
  get: (tenantId) => request(`/api/v1/tenants/${tenantId}/id-card-settings`),
  
  /** PUT /tenants/:tenantId/id-card-settings (upsert) */
  upsert: (tenantId, payload) => request(`/api/v1/tenants/${tenantId}/id-card-settings`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
}

// Combined API object for convenience
const tenantApi = {
  tenants: tenantsApi,
  entity: entityApi,
  domains: domainsApi,
  categories: categoriesApi,
  settings: settingsApi,
  theme: themeApi,
  ads: adsApi,
  featureFlags: featureFlagsApi,
  razorpay: razorpayApi,
  idCard: idCardApi,
}

export default tenantApi
