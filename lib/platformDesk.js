/**
 * Platform desk users (NEWS_DESK + platformDesk flag) — limited admin shell
 */

import { normalizeRole } from '../utils/roleUtils'

export const PLATFORM_DESK_HOME = '/admin/platform-syndication'

export const PLATFORM_DESK_ROUTES = [
  '/admin/profile',
  '/admin/platform-syndication',
  '/admin/news-cartoons',
]

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
  if (!user) return false
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
