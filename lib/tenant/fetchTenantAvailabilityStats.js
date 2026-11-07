import { tenantLifecycleApi } from '../api/services/tenantLifecycleApi'

export const EMPTY_TENANT_STATS = { total: 0, active: 0, suspended: 0, deleted: 0 }

/** Paginate admin tenant list and count by availability. */
export async function fetchTenantAvailabilityStats() {
  const merged = []
  let page = 1
  let totalPages = 1

  do {
    const res = await tenantLifecycleApi.list({
      page,
      pageSize: 200,
      includeDeleted: true,
      includeSuspended: true,
    })
    const rows = res?.data ?? []
    if (Array.isArray(rows)) merged.push(...rows)
    totalPages = Math.max(1, Number(res?.pagination?.totalPages) || 1)
    page += 1
  } while (page <= totalPages)

  const stats = { ...EMPTY_TENANT_STATS }
  merged.forEach((t) => {
    const a = String(t.availability || 'active').toLowerCase()
    stats.total += 1
    if (a === 'deleted') stats.deleted += 1
    else if (a === 'suspended') stats.suspended += 1
    else stats.active += 1
  })
  return stats
}
