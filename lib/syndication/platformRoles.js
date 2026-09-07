/** Platform roles allowed to use the syndication desk */

export const PLATFORM_SYNDICATION_ROLES = [
  'SUPER_ADMIN',
  'SUPERADMIN',
  'ADMIN',
  'NEWS_MODERATOR',
  'NEWS_DESK',
  'NEWS_DESK_ADMIN',
  'DESK_EDITOR',
  'DESKEDITOR',
  'NEWSDESK',
]

export function normalizeSyndicationRole(user) {
  const role = user?.role || user?.roleName || user?.userRole || user?.role?.name || ''
  const roleName = typeof role === 'string' ? role : role?.name || ''
  return String(roleName).toUpperCase().replace(/[_\s-]/g, '')
}

export function canAccessSyndication(user) {
  const r = normalizeSyndicationRole(user)
  return PLATFORM_SYNDICATION_ROLES.some((allowed) => allowed.replace(/[_\s-]/g, '').toUpperCase() === r)
}
