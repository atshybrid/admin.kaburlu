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
  surveyStatus = '',
  insuranceAccidental = '',
  insuranceHealth = '',
  omitUnionName = false,
}) {
  const params = {
    page: String(page),
    limit: String(limit),
  }
  // Omit ALL — some backends treat unknown status as empty list
  if (membershipStatus && membershipStatus !== 'ALL') {
    params.membershipStatus = membershipStatus
  }
  if (!omitUnionName) {
    params.unionName = resolveUnionName(unionName)
  }
  const term = String(q || '').trim()
  if (term) params.q = term
  if (memberType && memberType !== 'ALL') params.memberType = memberType
  if (String(state || '').trim()) params.state = String(state).trim()
  if (surveyStatus && surveyStatus !== 'ALL') params.surveyStatus = surveyStatus
  if (insuranceAccidental && insuranceAccidental !== 'ALL') {
    params.insuranceAccidental = insuranceAccidental
  }
  if (insuranceHealth && insuranceHealth !== 'ALL') params.insuranceHealth = insuranceHealth
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
