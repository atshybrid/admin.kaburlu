/** Platform roles allowed to manage Short News cartoons */

export const PLATFORM_CARTOON_ROLES = [
  'NEWS_MODERATOR',
  'ADMIN_EDITOR',
  'NEWS_DESK_ADMIN',
  'LANGUAGE_ADMIN',
  'NEWS_DESK',
  'PUBLISHER',
  'REVIEWER',
  'MODERATOR',
  'ANALYST',
  'SEO_EDITOR',
  'SUPER_ADMIN',
  'SUPERADMIN',
  'ADMIN',
]

export function normalizePlatformRole(user) {
  const role = user?.role || user?.roleName || user?.userRole || user?.role?.name || ''
  const roleName = typeof role === 'string' ? role : role?.name || ''
  return String(roleName).toUpperCase().replace(/[_\s-]/g, '')
}

export function canAccessNewsCartoons(user) {
  const r = normalizePlatformRole(user)
  return PLATFORM_CARTOON_ROLES.some((allowed) => allowed.replace(/[_\s-]/g, '').toUpperCase() === r)
}
