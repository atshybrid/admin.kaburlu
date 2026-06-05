import { resolveUnionName } from './unionConfig'

/** Query params for GET /journalist/admin/members (Super Admin guide). */
export function buildMembersListParams({
  unionName,
  page = 1,
  limit = 20,
  q = '',
  membershipStatus = 'ALL',
  memberType = '',
  state = '',
  omitUnionName = false,
}) {
  const params = {
    page: String(page),
    limit: String(limit),
    membershipStatus,
  }
  if (!omitUnionName) {
    params.unionName = resolveUnionName(unionName)
  }
  const term = String(q || '').trim()
  if (term) params.q = term
  if (memberType && memberType !== 'ALL') params.memberType = memberType
  if (String(state || '').trim()) params.state = String(state).trim()
  return params
}

/** Query params for GET /journalist/admin/members/pending */
export function buildPendingListParams({
  unionName,
  page = 1,
  limit = 20,
  q = '',
  status = 'all_pending',
  omitUnionName = false,
}) {
  const params = {
    page: String(page),
    limit: String(limit),
    status,
  }
  if (!omitUnionName) {
    params.unionName = resolveUnionName(unionName)
  }
  const term = String(q || '').trim()
  if (term) params.q = term
  return params
}
