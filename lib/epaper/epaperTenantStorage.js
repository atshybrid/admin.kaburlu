/** Same key as pages/admin/epaper/design.js — keeps tenant in sync across ePaper tools */

export const EPAPER_TENANT_STORAGE_KEY = 'epaper_design_selected_tenant_id'

export function getStoredTenantId() {
  if (typeof window === 'undefined') return ''
  return String(window.localStorage.getItem(EPAPER_TENANT_STORAGE_KEY) || '').trim()
}

export function setStoredTenantId(tenantId) {
  if (typeof window === 'undefined') return
  const id = String(tenantId || '').trim()
  if (id) window.localStorage.setItem(EPAPER_TENANT_STORAGE_KEY, id)
  else window.localStorage.removeItem(EPAPER_TENANT_STORAGE_KEY)
}

export function getTenantDisplayName(tenant) {
  return String(tenant?.name || tenant?.tenantName || tenant?.slug || 'Unnamed Tenant')
}
