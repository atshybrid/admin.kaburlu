/**
 * Map operator scope → intake tenant UI (assigned tenants = no manual pick every time).
 */

export function filterTenantsForOperator(allTenants, scope) {
  const allowed = scope?.allowedTenantIds || []
  if (!allowed.length) return allTenants || []
  const set = new Set(allowed)
  return (allTenants || []).filter((t) => set.has(t.id))
}

export function resolveIntakeTenantSelection(scope, scopedTenants) {
  const defaults = scope?.defaultIntakeTenantIds?.length
    ? scope.defaultIntakeTenantIds
    : (scopedTenants || []).map((t) => t.id)

  const lock = Boolean(scope?.lockTenantSelection) && defaults.length > 0
  const single = lock && defaults.length === 1

  return {
    selectedIds: defaults,
    lockSelection: lock,
    hidePicker: single,
    showAssignedBanner: lock,
  }
}