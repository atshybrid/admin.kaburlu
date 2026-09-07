/**
 * Platform desk users (NEWS_DESK + platformDesk flag) — focused admin shell
 * (syndication + ePaper + profile). Super Admin always gets the full dashboard.
 */

function normalizeRole(user) {
  const role = user?.role || user?.roleName || user?.userRole || user?.role?.name || ''
  const roleName = typeof role === 'string' ? role : (role?.name || '')
  return String(roleName).toUpperCase().replace(/[_\s-]/g, '')
}

export const PLATFORM_DESK_HOME = '/admin/platform-syndication'

export const PLATFORM_DESK_ROUTES = [
  '/admin/profile',
  '/admin/platform-syndication',
  '/admin/news-cartoons',
  '/admin/epaper',
]

/** Roles that must never use the limited platform-desk shell */
export function hasFullDashboardAccess(user) {
  if (!user) return false

  const role = normalizeRole(user)
  if (role === 'SUPERADMIN' || role === 'ADMIN') return true

  const fullPlatformRoles = ['NEWSMODERATOR', 'NEWSDESKADMIN', 'LANGUAGEADMIN', 'PUBLISHER']
  return fullPlatformRoles.includes(role)
}

export function enrichAuthUser(user, authData = {}) {
  if (!user) return null
  const data = authData?.data || authData || {}
  return {
    ...user,
    tenantId: user.tenantId || data.tenantId || null,
    domainId: user.domainId || data.domainId || null,
    platformDesk: user.platformDesk ?? data.platformDesk ?? false,
    roleFamily: user.role?.family || user.roleFamily || data.roleFamily || null,
  }
}

export function isPlatformDeskUser(user) {
  if (!user || hasFullDashboardAccess(user)) return false

  if (user.platformDesk === true) return true

  const role = normalizeRole(user)
  const family = String(user.roleFamily || user.role?.family || '').toUpperCase()

  if (family === 'PLATFORM' && role === 'NEWSDESK') return true

  return false
}

export function isPlatformDeskRouteAllowed(pathname) {
  if (!pathname) return false
  return PLATFORM_DESK_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  )
}
