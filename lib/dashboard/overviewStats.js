import { getToken } from '../../utils/auth'

function getProxyBase() {
  return '/api/proxy'
}

async function proxyGet(path) {
  const t = getToken()
  const res = await fetch(`${getProxyBase()}${path}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${t?.token || ''}`,
    },
  })
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

function normalizeList(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.tenants)) return data.tenants
  return []
}

function formatRelativeTime(dateInput) {
  if (!dateInput) return ''
  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) return ''
  const diffMs = Date.now() - date.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

function buildActivityFromTenants(tenants) {
  const items = []

  for (const tenant of tenants) {
    if (tenant.createdAt) {
      items.push({
        id: `tenant-${tenant.id}`,
        title: 'Tenant registered',
        description: tenant.name || tenant.slug || 'New tenant',
        time: formatRelativeTime(tenant.createdAt),
        at: new Date(tenant.createdAt).getTime(),
        href: tenant.id ? `/admin/tenants/${tenant.id}` : '/admin/tenants',
      })
    }

    const domains = Array.isArray(tenant.domains) ? tenant.domains : []
    for (const domain of domains) {
      const stamp = domain.verifiedAt || domain.updatedAt || domain.createdAt
      if (!stamp) continue
      items.push({
        id: `domain-${domain.id}`,
        title: domain.status === 'VERIFIED' ? 'Domain verified' : 'Domain updated',
        description: domain.domain || domain.name || 'Domain',
        time: formatRelativeTime(stamp),
        at: new Date(stamp).getTime(),
        href: tenant.id ? `/admin/tenants/${tenant.id}` : '/admin/tenants',
      })
    }
  }

  return items.sort((a, b) => b.at - a.at).slice(0, 8)
}

export async function fetchOverviewDashboardStats() {
  const [tenantsResult, languagesResult, usersResult, categoriesResult] = await Promise.allSettled([
    proxyGet('/tenants?full=true'),
    proxyGet('/languages'),
    proxyGet('/users'),
    proxyGet('/categories?languageCode=te'),
  ])

  const tenants = tenantsResult.status === 'fulfilled'
    ? normalizeList(tenantsResult.value)
    : []

  const languages = languagesResult.status === 'fulfilled'
    ? normalizeList(languagesResult.value)
    : []

  const users = usersResult.status === 'fulfilled'
    ? normalizeList(usersResult.value)
    : []

  const categories = categoriesResult.status === 'fulfilled'
    ? normalizeList(categoriesResult.value)
    : []

  const activeDomains = tenants.reduce((sum, tenant) => {
    const domains = Array.isArray(tenant.domains) ? tenant.domains : []
    const active = domains.filter((d) => {
      const status = String(d.status || '').toUpperCase()
      return status === 'VERIFIED' || status === 'ACTIVE' || d.isActive === true
    })
    return sum + (active.length || domains.length)
  }, 0)

  const recentTenants = [...tenants]
    .filter((t) => t.createdAt)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3)

  return {
    stats: {
      tenants: tenants.length,
      domains: activeDomains,
      categories: categories.length,
      languages: languages.length,
      users: users.length,
    },
    recentActivity: buildActivityFromTenants(tenants),
    recentTenants,
    errors: {
      tenants: tenantsResult.status === 'rejected',
      languages: languagesResult.status === 'rejected',
      users: usersResult.status === 'rejected',
      categories: categoriesResult.status === 'rejected',
    },
  }
}

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${getProxyBase()}/languages`, {
      headers: { Authorization: `Bearer ${getToken()?.token || ''}` },
    }).catch(() => null)

    if (!res) return 'offline'
    if (res.ok) return 'online'
    if (res.status === 401 || res.status === 403) return 'online'
    return 'degraded'
  } catch {
    return 'offline'
  }
}
