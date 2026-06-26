/**
 * Union admin access — SUPER_ADMIN and UNION_MODERATOR share full union APIs.
 */
import { hasRole, normalizeRole } from '../../utils/roleUtils'

export const UNION_ADMIN_ROLES = ['SUPER_ADMIN', 'SUPERADMIN', 'ADMIN', 'UNION_MODERATOR']

export function isUnionModerator(user) {
  return normalizeRole(user) === 'UNIONMODERATOR'
}

export function isUnionSuperAdmin(user) {
  return hasRole(user, ['SUPER_ADMIN', 'SUPERADMIN', 'ADMIN'])
}

/** Either role can use union-admin member workflow */
export function canAccessJournalistUnion(user) {
  return hasRole(user, UNION_ADMIN_ROLES)
}

/** Platform super-admin only (assign union admins, etc.) */
export function canManageUnionAdmins(user) {
  return isUnionSuperAdmin(user)
}

export function unionDashboardLabel(user) {
  if (isUnionModerator(user)) return 'Union Moderator'
  if (isUnionSuperAdmin(user)) return 'Super Admin'
  return 'Union Admin'
}
