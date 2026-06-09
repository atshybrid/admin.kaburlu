/**
 * Resolve tenant list + entity from login token (Reporter / Tenant Admin).
 * Login returns user.tenant — not always loginResponse.tenants[].
 */

import { getUserTenantId } from '../../utils/roleUtils'

export function resolveTenantId(tenantOrId) {
  if (!tenantOrId) return ''
  if (typeof tenantOrId === 'string') return tenantOrId
  return tenantOrId.id || tenantOrId.tenantId || ''
}

/** All tenants available to the logged-in user */
export function resolveAuthTenants(tokenData, user) {
  const data = tokenData?.data || {}
  const u = user || tokenData?.user || data.user || {}

  const fromArray =
    data.loginResponse?.tenants ||
    u.loginResponse?.tenants ||
    data.tenants ||
    u.tenants ||
    []

  if (Array.isArray(fromArray) && fromArray.length > 0) {
    return fromArray
  }

  const single =
    u.tenant ||
    data.tenant ||
    data.user?.tenant ||
    null

  if (single && typeof single === 'object') {
    return [single]
  }

  const tid = getUserTenantId(u)
  if (tid) {
    return [{ id: tid, tenantId: tid, name: u.tenantName || u.organization?.name || '' }]
  }

  return []
}

/** Full tenant object with entity for AI (from cache or list) */
export function resolveTenantRecord(tokenData, user, tenantId) {
  const id = String(tenantId || '').trim()
  if (!id) return null

  const list = resolveAuthTenants(tokenData, user)
  const hit = list.find((t) => resolveTenantId(t) === id)
  if (hit) return hit

  const u = user || tokenData?.user
  const single = u?.tenant || tokenData?.data?.tenant
  if (single && resolveTenantId(single) === id) return single

  return null
}

export function tenantEntityName(tenant) {
  if (!tenant) return ''
  const entity = tenant.entity || tenant
  return entity.nativeName || entity.name || tenant.name || ''
}
