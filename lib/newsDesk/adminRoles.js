import { normalizeSyndicationRole } from '../syndication/platformRoles'

export function canManageNewsDeskStaff(user) {
  const r = normalizeSyndicationRole(user)
  return r === 'SUPERADMIN' || r === 'SUPER_ADMIN' || r === 'NEWS_DESK_ADMIN'
}