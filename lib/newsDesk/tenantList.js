import { tenantsApi } from '../api/tenantApi'
import { filterActiveTenants } from '../tenant/isActiveTenant'
import { resolveTenantId } from '../article/resolveAuthTenants'

export { buildTenantsIntakePayload, defaultTenantSelection, DEFAULT_NEWS_DESK_TENANT_ID } from './tenantIntake'

function unwrapTenants(raw) {
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw?.data)) return raw.data
  if (Array.isArray(raw?.items)) return raw.items
  if (Array.isArray(raw?.tenants)) return raw.tenants
  return []
}

export function tenantDisplayName(tenant) {
  if (!tenant) return ''
  return (
    tenant.entity?.nativeName ||
    tenant.nativeName ||
    tenant.name ||
    tenant.slug ||
    tenant.id ||
    ''
  ).trim()
}

export async function loadNewsDeskTenants() {
  const response = await tenantsApi.list(true)
  const list = filterActiveTenants(unwrapTenants(response))
  return list
    .map((tenant) => {
      const id = resolveTenantId(tenant)
      if (!id) return null
      const name = (tenant.name || tenant.slug || id).trim()
      const nativeName = tenantDisplayName(tenant) || name
      return { id, name, nativeName, slug: tenant.slug || '' }
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name))
}