/** Active tenants only — for syndication, billing pickers, etc. */

export function tenantAvailability(tenant) {
  if (!tenant) return 'unknown'
  if (tenant.availability) return String(tenant.availability).toLowerCase()
  if (tenant.deletedAt) return 'deleted'
  if (tenant.suspendedAt) return 'suspended'
  return 'active'
}

export function isActiveTenant(tenant) {
  return tenantAvailability(tenant) === 'active'
}

export function filterActiveTenants(list) {
  if (!Array.isArray(list)) return []
  return list.filter(isActiveTenant)
}
