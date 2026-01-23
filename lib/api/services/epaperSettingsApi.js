/**
 * EPaper Domain Settings API
 * Handles EPAPER domain-specific settings (branding, SEO, theme, integrations)
 */

function getApiBase() {
  if (typeof window !== 'undefined') {
    return '/api/admin/proxy'
  }
  return (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://app.kaburlumedia.com').replace(/\/$/, '') + '/api/v1'
}

async function request(path, options = {}) {
  const res = await fetch(`${getApiBase()}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || data.error || `Request failed: ${res.status}`)
  }
  
  return res.json()
}

/**
 * Get EPAPER domain settings
 * @param {string} tenantId - Tenant ID
 * @param {string} domainId - Domain ID
 * @returns {Promise<Object>} Settings with effective merged data
 */
export async function getEpaperSettings(tenantId, domainId) {
  return await request(`/tenants/${tenantId}/domains/${domainId}/settings`)
}

/**
 * Replace entire EPAPER domain settings
 * @param {string} tenantId - Tenant ID
 * @param {string} domainId - Domain ID
 * @param {Object} settings - Complete settings object
 * @param {boolean} autoSeo - Auto-fill missing SEO fields via AI (default: true)
 * @returns {Promise<Object>} Updated settings
 */
export async function replaceEpaperSettings(tenantId, domainId, settings, autoSeo = true) {
  const params = new URLSearchParams()
  if (autoSeo) params.append('autoSeo', 'true')
  
  const path = `/tenants/${tenantId}/domains/${domainId}/settings${params.toString() ? '?' + params.toString() : ''}`
  
  return await request(path, {
    method: 'PUT',
    body: JSON.stringify(settings)
  })
}

/**
 * Partially update EPAPER domain settings (deep merge)
 * @param {string} tenantId - Tenant ID
 * @param {string} domainId - Domain ID
 * @param {Object} partialSettings - Partial settings to merge
 * @param {boolean} autoSeo - Auto-fill missing SEO fields via AI (default: true)
 * @returns {Promise<Object>} Updated settings
 */
export async function updateEpaperSettings(tenantId, domainId, partialSettings, autoSeo = true) {
  const params = new URLSearchParams()
  if (autoSeo) params.append('autoSeo', 'true')
  
  const path = `/tenants/${tenantId}/domains/${domainId}/settings${params.toString() ? '?' + params.toString() : ''}`
  
  return await request(path, {
    method: 'PATCH',
    body: JSON.stringify(partialSettings)
  })
}

/**
 * Auto-generate missing SEO fields via AI
 * @param {string} tenantId - Tenant ID
 * @param {string} domainId - Domain ID
 * @returns {Promise<Object>} Settings with AI-generated SEO
 */
export async function autoGenerateSeo(tenantId, domainId) {
  return await request(`/tenants/${tenantId}/domains/${domainId}/settings/seo/auto`, {
    method: 'POST'
  })
}

const epaperSettingsApi = {
  get: getEpaperSettings,
  replace: replaceEpaperSettings,
  update: updateEpaperSettings,
  autoGenerateSeo
}

export default epaperSettingsApi
