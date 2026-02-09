/**
 * Tenant API Service - Complete API integration for tenant management
 * Covers all endpoints from tenants.routes.ts, domains.routes.ts, settings.routes.ts,
 * tenantTheme.routes.ts, tenantAds.routes.ts
 * Uses local proxy to bypass CORS issues
 */
import { getToken } from '../../utils/auth'

function getApiBase() {
  // Use proxy in browser to avoid CORS; call backend directly on server.
  if (typeof window !== 'undefined') return '/api/proxy'
  const raw = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://api.kaburlumedia.com'
  const base = String(raw || '').replace(/\/+$/, '')
  const collapsed = base.replace(/(\/api\/v1)+$/, '/api/v1')
  return collapsed.endsWith('/api/v1') ? collapsed : `${collapsed}/api/v1`
}

async function request(path, options = {}) {
  const t = getToken()
  const baseUrl = getApiBase()
  const url = `${baseUrl}${path}`
  
  // 🔍 DEBUG: Log full request details
  if (typeof window !== 'undefined') {
    console.group('🚀 Tenant API Request')
    console.log('📍 Base URL:', baseUrl)
    console.log('📍 Endpoint:', path)
    console.log('📍 Full URL:', url)
    console.log('📍 Method:', options.method || 'GET')
    console.log('🔑 Token:', t?.token ? `${t.token.substring(0, 30)}...` : '❌ NO TOKEN')
    if (options.body) {
      try {
        console.log('📦 Payload:', JSON.parse(options.body))
      } catch {
        console.log('📦 Payload (raw):', options.body)
      }
    }
    console.groupEnd()
  }
  
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${t?.token || ''}`,
      ...options.headers,
    },
  })
  
  // 🔍 DEBUG: Log response
  if (typeof window !== 'undefined') {
    console.log(`📬 Response: ${res.status} ${res.statusText} for ${path}`)
  }
  
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    console.error('❌ API Error:', res.status, data)
    throw new Error(data.message || data.error || `Request failed: ${res.status}`)
  }
  
  return res.json()
}

// ============================================
// 1) TENANTS CRUD
// ============================================
export const tenantsApi = {
  /** GET /tenants?full=true|false */
  list: (full = true) => request(`/tenants?full=${full}`),
  
  /** GET /tenants/:id */
  get: (id) => request(`/tenants/${id}`),
  
  /** POST /tenants (SUPER_ADMIN) */
  create: (payload) => request('/tenants', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  
  /** PATCH /tenants/:id (SUPER_ADMIN) */
  update: (id, payload) => request(`/tenants/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
}

// ============================================
// 2) TENANT ENTITY (PRGI / Publisher details)
// ============================================
export const entityApi = {
  /** GET /tenants/:tenantId/entity */
  get: (tenantId) => request(`/tenants/${tenantId}/entity`),
  
  /** POST /tenants/:tenantId/entity (upsert) */
  create: (tenantId, payload) => request(`/tenants/${tenantId}/entity`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  
  /** POST /tenants/:tenantId/entity/simple */
  createSimple: (tenantId, payload) => request(`/tenants/${tenantId}/entity/simple`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  
  /** PUT /tenants/:tenantId/entity */
  update: (tenantId, payload) => request(`/tenants/${tenantId}/entity`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  
  /** PUT /tenants/:tenantId/entity/business */
  updateBusiness: (tenantId, payload) => request(`/tenants/${tenantId}/entity/business`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  
  /** PATCH /tenants/:tenantId/entity/native-name */
  updateNativeName: (tenantId, nativeName) => request(`/tenants/${tenantId}/entity/native-name`, {
    method: 'PATCH',
    body: JSON.stringify({ nativeName }),
  }),
}

// ============================================
// 3) TENANT DOMAINS
// ============================================
export const domainsApi = {
  /** GET /domains (global list) */
  list: () => request('/domains'),
  
  /** POST /tenants/:tenantId/domains */
  create: (tenantId, payload) => request(`/tenants/${tenantId}/domains`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  
  /** POST /domains/:id/verify (SUPER_ADMIN) */
  verify: (domainId, payload = { method: 'MANUAL', force: false }) => 
    request(`/domains/${domainId}/verify`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  
  /** PATCH /domains/:id/kind (SUPER_ADMIN) */
  setKind: (domainId, kind) => request(`/domains/${domainId}/kind`, {
    method: 'PATCH',
    body: JSON.stringify({ kind }),
  }),
  
  /** PUT /domains/:id/categories (SUPER_ADMIN) */
  setCategories: (domainId, payload) => request(`/domains/${domainId}/categories`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  
  /** DELETE /tenants/:tenantId/domains/:domainId */
  delete: (tenantId, domainId) => request(`/tenants/${tenantId}/domains/${domainId}`, {
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
    return request(`/tenants/${tenantId}/categories?${params}`)
  },
  
  /** GET /categories (global) */
  listAll: () => request('/categories'),
}

// ============================================
// 5) SETTINGS (Entity/Tenant/Domain layering)
// ============================================
export const settingsApi = {
  // Entity defaults (SUPER_ADMIN)
  entity: {
    get: () => request('/entity/settings'),
    put: (settings) => request('/entity/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
    patch: (settings) => request('/entity/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    }),
  },
  
  // Tenant settings (SUPER_ADMIN)
  tenant: {
    get: (tenantId) => request(`/tenants/${tenantId}/settings`),
    put: (tenantId, settings) => request(`/tenants/${tenantId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
    patch: (tenantId, settings) => request(`/tenants/${tenantId}/settings`, {
      method: 'PATCH',
      body: JSON.stringify(settings),
    }),
  },
  
  // Domain settings (SUPER_ADMIN)
  domain: {
    get: (tenantId, domainId) => request(`/tenants/${tenantId}/domains/${domainId}/settings`),
    put: (tenantId, domainId, settings) => request(`/tenants/${tenantId}/domains/${domainId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
    patch: (tenantId, domainId, settings) => request(`/tenants/${tenantId}/domains/${domainId}/settings`, {
      method: 'PATCH',
      body: JSON.stringify(settings),
    }),
    list: (tenantId, { page = 1, pageSize = 20 } = {}) => 
      request(`/tenants/${tenantId}/domains/settings?page=${page}&pageSize=${pageSize}`),
  },
}

// ============================================
// 6) TENANT THEME + HOMEPAGE CONFIG
// ============================================
export const themeApi = {
  /** GET /tenant-theme/:tenantId */
  get: (tenantId) => request(`/tenant-theme/${tenantId}`),
  
  /** PATCH /tenant-theme/:tenantId (upsert) */
  update: (tenantId, payload) => request(`/tenant-theme/${tenantId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
  
  // Homepage config
  homepage: {
    /** GET /tenant-theme/:tenantId/homepage/:style */
    get: (tenantId, style) => request(`/tenant-theme/${tenantId}/homepage/${style}`),
    
    /** GET /tenant-theme/:tenantId/homepage/:style/default */
    getDefault: (tenantId, style) => request(`/tenant-theme/${tenantId}/homepage/${style}/default`),
    
    /** POST /tenant-theme/:tenantId/homepage/:style/apply-default */
    applyDefault: (tenantId, style) => request(`/tenant-theme/${tenantId}/homepage/${style}/apply-default`, {
      method: 'POST',
    }),
    
    /** PATCH /tenant-theme/:tenantId/homepage/:style/sections */
    updateSections: (tenantId, style, sections) => request(`/tenant-theme/${tenantId}/homepage/${style}/sections`, {
      method: 'PATCH',
      body: JSON.stringify({ sections }),
    }),
    
    // Style1 Smart Config helpers
    style1Smart: {
      /** GET /tenant-theme/:tenantId/homepage/style1/smart */
      get: (tenantId) => request(`/tenant-theme/${tenantId}/homepage/style1/smart`),
      
      /** PUT /tenant-theme/:tenantId/homepage/style1/smart */
      update: (tenantId, config) => request(`/tenant-theme/${tenantId}/homepage/style1/smart`, {
        method: 'PUT',
        body: JSON.stringify(config),
      }),
    },
    
    // Style2 v2 helpers
    style2v2: {
      get: (tenantId) => request(`/tenant-theme/${tenantId}/homepage/style2/v2`),
      applyDefault: (tenantId) => request(`/tenant-theme/${tenantId}/homepage/style2/v2/apply-default`, {
        method: 'POST',
      }),
      updateSections: (tenantId, sections) => request(`/tenant-theme/${tenantId}/homepage/style2/v2/sections`, {
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
  list: (tenantId) => request(`/tenants/${tenantId}/ads`),
  
  /** POST /tenants/:tenantId/ads */
  create: (tenantId, payload) => request(`/tenants/${tenantId}/ads`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  
  /** PATCH /tenants/:tenantId/ads/:adId */
  update: (tenantId, adId, payload) => request(`/tenants/${tenantId}/ads/${adId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
  
  /** DELETE /tenants/:tenantId/ads/:adId */
  delete: (tenantId, adId) => request(`/tenants/${tenantId}/ads/${adId}`, {
    method: 'DELETE',
  }),
  
  // Slot-based ads config
  style1: {
    get: (tenantId) => request(`/tenants/${tenantId}/ads/style1`),
    put: (tenantId, ads) => request(`/tenants/${tenantId}/ads/style1`, {
      method: 'PUT',
      body: JSON.stringify(ads),
    }),
    patch: (tenantId, ads) => request(`/tenants/${tenantId}/ads/style1`, {
      method: 'PATCH',
      body: JSON.stringify(ads),
    }),
  },
  
  style2: {
    get: (tenantId) => request(`/tenants/${tenantId}/ads/style2`),
    put: (tenantId, ads) => request(`/tenants/${tenantId}/ads/style2`, {
      method: 'PUT',
      body: JSON.stringify(ads),
    }),
    patch: (tenantId, ads) => request(`/tenants/${tenantId}/ads/style2`, {
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
  get: (tenantId) => request(`/tenants/${tenantId}/feature-flags`),
  
  /** PATCH /tenants/:tenantId/feature-flags */
  patch: (tenantId, flags) => request(`/tenants/${tenantId}/feature-flags`, {
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
    return request(`/tenants/razorpay-configs?${params}`)
  },
  
  /** GET /tenants/:tenantId/razorpay-config */
  get: (tenantId) => request(`/tenants/${tenantId}/razorpay-config`),
  
  /** POST /tenants/:tenantId/razorpay-config (create, fails 409 if exists) */
  create: (tenantId, payload) => request(`/tenants/${tenantId}/razorpay-config`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  
  /** PUT /tenants/:tenantId/razorpay-config (upsert) */
  upsert: (tenantId, payload) => request(`/tenants/${tenantId}/razorpay-config`, {
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
    request(`/tenants/id-card-settings?page=${page}&pageSize=${pageSize}`),
  
  /** GET /tenants/:tenantId/id-card-settings */
  get: (tenantId) => request(`/tenants/${tenantId}/id-card-settings`),
  
  /** PUT /tenants/:tenantId/id-card-settings (upsert) */
  upsert: (tenantId, payload) => request(`/tenants/${tenantId}/id-card-settings`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
}

// ============================================
// 11) SEO CONFIG
// ============================================
export const seoApi = {
  /** GET /tenant-theme/:tenantId/seo */
  get: (tenantId) => request(`/tenant-theme/${tenantId}/seo`),
  
  /** PATCH /tenant-theme/:tenantId/seo */
  patch: (tenantId, payload) => request(`/tenant-theme/${tenantId}/seo`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
}

// ============================================
// 12) LEGAL/STATIC PAGES
// ============================================
export const pagesApi = {
  /** GET /tenants/:tenantId/pages */
  list: (tenantId) => request(`/tenants/${tenantId}/pages`),
  
  /** GET /tenants/:tenantId/pages/:slug */
  get: (tenantId, slug) => request(`/tenants/${tenantId}/pages/${slug}`),
  
  /** PUT /tenants/:tenantId/pages/:slug (create or update) */
  upsert: (tenantId, slug, payload) => request(`/tenants/${tenantId}/pages/${slug}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  
  /** PATCH /tenants/:tenantId/pages/:slug */
  patch: (tenantId, slug, payload) => request(`/tenants/${tenantId}/pages/${slug}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
  
  /** DELETE /tenants/:tenantId/pages/:slug */
  delete: (tenantId, slug) => request(`/tenants/${tenantId}/pages/${slug}`, {
    method: 'DELETE',
  }),
}

// ============================================
// 13) TENANT ADMINS (Admin routes)
// ============================================
export const tenantAdminsApi = {
  /** GET /admin/tenants/:tenantId/admins */
  list: (tenantId) => request(`/admin/tenants/${tenantId}/admins`),

  /** POST /admin/tenants/:tenantId/admins */
  create: (tenantId, payload) => request(`/admin/tenants/${tenantId}/admins`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  /** PUT /admin/tenants/:tenantId/admins (upsert by mobileNumber) */
  upsert: (tenantId, payload) => request(`/admin/tenants/${tenantId}/admins`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
}

// ============================================
// 14) REPORTERS
// ============================================
export const reportersApi = {
  /** GET /tenants/:tenantId/reporters */
  list: (tenantId) => request(`/tenants/${tenantId}/reporters`),
  
  /** GET /tenants/:tenantId/reporters/:reporterId */
  get: (tenantId, reporterId) => request(`/tenants/${tenantId}/reporters/${reporterId}`),
  
  /** POST /tenants/:tenantId/reporters */
  create: (tenantId, payload) => request(`/tenants/${tenantId}/reporters`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  
  /** PUT /tenants/:tenantId/reporters/:reporterId */
  update: (tenantId, reporterId, payload) => request(`/tenants/${tenantId}/reporters/${reporterId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  
  /** PATCH /tenants/:tenantId/reporters/:reporterId/auto-publish */
  setAutoPublish: (tenantId, reporterId, autoPublish) => 
    request(`/tenants/${tenantId}/reporters/${reporterId}/auto-publish`, {
      method: 'PATCH',
      body: JSON.stringify({ autoPublish }),
    }),
}

// ============================================
// 14) CATEGORIES (Tenant-level operations)
// ============================================
export const tenantCategoriesApi = {
  /** GET /tenants/:tenantId/categories */
  list: (tenantId, { includeTranslation = true, domainId } = {}) => {
    const params = new URLSearchParams({ includeTranslation: String(includeTranslation) })
    if (domainId) params.append('domainId', domainId)
    return request(`/tenants/${tenantId}/categories?${params}`)
  },
  
  /** PUT /tenants/:tenantId/categories */
  update: (tenantId, categorySlugs) => request(`/tenants/${tenantId}/categories`, {
    method: 'PUT',
    body: JSON.stringify({ categorySlugs }),
  }),
}

// Combined API object for convenience
const tenantApi = {
  tenants: tenantsApi,
  entity: entityApi,
  domains: domainsApi,
  categories: categoriesApi,
  tenantCategories: tenantCategoriesApi,
  settings: settingsApi,
  theme: themeApi,
  ads: adsApi,
  featureFlags: featureFlagsApi,
  razorpay: razorpayApi,
  idCard: idCardApi,
  seo: seoApi,
  pages: pagesApi,
  tenantAdmins: tenantAdminsApi,
  reporters: reportersApi,
}

export default tenantApi
