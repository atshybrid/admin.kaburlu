/**
 * Load member queue / directory with API fallbacks.
 */
import { journalistApi } from '../api/services/journalistApi'
import { unionAdminApi } from '../api/services/unionAdminApi'
import { normalizePagedList } from './apiNormalize'
import { buildMembersListParams, buildPendingListParams } from './memberApiParams'
import { hasPendingDocuments, membershipPending } from './memberDisplay'
import { filterMembersBySearch } from './memberSearch'

export function isMemberRouteError(err) {
  const code = err?.data?.code || err?.data?.errorCode
  return (
    err?.status === 404 ||
    code === 'MEMBER_NOT_FOUND' ||
    code === 'NOT_FOUND' ||
    code === 'ROUTE_NOT_FOUND'
  )
}

function unionMatches(row, unionName) {
  const union = String(unionName || '').trim().toLowerCase()
  if (!union) return true
  const rowUnion = String(row?.unionName || '').trim().toLowerCase()
  if (!rowUnion) return true
  return rowUnion.includes(union) || union.includes(rowUnion.slice(0, 12))
}

function filterQueueItems(items, status) {
  if (status === 'pending_membership') {
    return items.filter((r) => membershipPending(r))
  }
  if (status === 'pending_documents' || status === 'pending_verification') {
    return items.filter((r) =>
      hasPendingDocuments(r) &&
      (r.documents?.photo?.status === 'PENDING' ||
        r.documents?.workingIdCard?.status === 'PENDING' ||
        r.pendingActions?.some((a) => ['photo', 'workingIdCard', 'VERIFICATION'].includes(String(a).toLowerCase())))
    )
  }
  if (status === 'pending_insurance_docs') {
    return items.filter((r) =>
      r.documents?.aadhaar?.status === 'PENDING' ||
      r.documents?.pan?.status === 'PENDING' ||
      r.pendingActions?.some((a) => ['aadhaar', 'pan', 'INSURANCE'].includes(String(a)))
    )
  }
  if (status === 'all_pending') {
    return items.filter(
      (r) =>
        membershipPending(r) ||
        hasPendingDocuments(r) ||
        (Array.isArray(r.pendingActions) && r.pendingActions.length > 0)
    )
  }
  return items
}

function mapApplicationToMember(app) {
  const profile = app.journalistProfile || app.profile || app
  const user = profile?.user || app.user
  return {
    id: profile?.id || app.profileId || app.journalistProfileId || app.id,
    fullName:
      app.fullName ||
      profile?.fullName ||
      user?.profile?.fullName ||
      user?.fullName ||
      '—',
    mobileNumber: app.mobileNumber || profile?.mobileNumber || user?.mobileNumber,
    membershipStatus: app.status || app.membershipStatus || 'PENDING',
    unionName: app.unionName || profile?.unionName,
    documents: app.documents || profile?.documents,
    pendingActions: app.pendingActions || ['MEMBERSHIP'],
    createdAt: app.createdAt || app.appliedAt,
    memberType: app.memberType || profile?.memberType,
    designation: app.designation || profile?.designation,
    currentNewspaper: app.currentNewspaper || profile?.currentNewspaper,
  }
}

function normalizeApplicationsList(raw) {
  const parsed = normalizePagedList(raw)
  const items = parsed.items.map(mapApplicationToMember).filter((r) => r.id)
  return {
    ...parsed,
    items,
    total: parsed.total || items.length,
    source: 'applications',
  }
}

function applySearch(items, q, apiTotal) {
  const filtered = filterMembersBySearch(items, q)
  if (!String(q || '').trim()) {
    return { items: filtered, total: apiTotal ?? filtered.length }
  }
  return { items: filtered, total: filtered.length }
}

async function fetchMembersOnce(params) {
  const raw = await journalistApi.listMembers(params)
  return normalizePagedList(raw)
}

/**
 * Review queue — tries pending endpoint, then members?membershipStatus=PENDING, then applications.
 */
export async function fetchPendingQueue({
  unionName,
  page = 1,
  limit = 100,
  q = '',
  status = 'all_pending',
  tryWithoutUnion = true,
}) {
  const pendingParams = buildPendingListParams({ unionName, page, limit, q, status })

  try {
    const raw = await unionAdminApi.listPending(pendingParams)
    const parsed = normalizePagedList(raw)
    let items = filterQueueItems(parsed.items, status)
    const searched = applySearch(items, q, parsed.total)
    return { ...parsed, ...searched, source: 'union-admin-pending' }
  } catch (err) {
    if (!isMemberRouteError(err)) throw err
  }

  try {
    const raw = await journalistApi.listPendingMembers(pendingParams)
    const parsed = normalizePagedList(raw)
    let items = filterQueueItems(parsed.items, status)
    const searched = applySearch(items, q, parsed.total)
    return { ...parsed, ...searched, source: 'pending' }
  } catch (err) {
    if (!isMemberRouteError(err)) throw err
  }

  const membersParams = buildMembersListParams({
    unionName,
    page,
    limit,
    q,
    membershipStatus: 'PENDING',
  })

  try {
    const parsed = await fetchMembersOnce(membersParams)
    let items = filterQueueItems(parsed.items, status)
    const searched = applySearch(items, q, parsed.total)
    return { ...parsed, ...searched, source: 'members-pending' }
  } catch (err) {
    if (!isMemberRouteError(err) && err?.status !== 400) throw err
  }

  if (tryWithoutUnion) {
    try {
      const parsed = await fetchMembersOnce(
        buildMembersListParams({
          unionName,
          page,
          limit,
          q,
          membershipStatus: 'PENDING',
          omitUnionName: true,
        })
      )
      let items = parsed.items.filter((r) => unionMatches(r, unionName))
      items = filterQueueItems(items, status)
      const searched = applySearch(items, q, items.length)
      return {
        ...parsed,
        ...searched,
        source: 'members-pending-all-unions',
      }
    } catch (err) {
      if (!isMemberRouteError(err)) throw err
    }
  }

  const raw = await journalistApi.listApplications({
    status: 'PENDING',
    page: String(page),
    limit: String(limit),
    ...(q?.trim() ? { q: q.trim() } : {}),
  })
  const parsed = normalizeApplicationsList(raw)
  let items = filterQueueItems(parsed.items, status)
  const searched = applySearch(items, q, items.length)
  return { ...parsed, ...searched, source: 'applications' }
}

/**
 * Member directory — GET /members with fallbacks when union filter returns empty.
 */
export async function fetchMemberDirectory({
  unionName,
  page = 1,
  limit = 20,
  q = '',
  membershipStatus = 'ALL',
  surveyStatus = '',
  insuranceAccidental = '',
  insuranceHealth = '',
  tryWithoutUnion = true,
}) {
  const baseParams = {
    unionName,
    page,
    limit,
    q,
    membershipStatus,
    surveyStatus,
    insuranceAccidental,
    insuranceHealth,
  }

  const run = async (omitUnionName = false) => {
    const parsed = await fetchMembersOnce(
      buildMembersListParams({ ...baseParams, omitUnionName })
    )
    let items = omitUnionName
      ? parsed.items.filter((r) => unionMatches(r, unionName))
      : parsed.items
    const searched = applySearch(items, q, omitUnionName ? items.length : parsed.total)
    return {
      ...parsed,
      ...searched,
      source: omitUnionName ? 'members-all-unions' : 'members',
    }
  }

  try {
    const result = await run(false)
    if (result.items.length > 0 || !tryWithoutUnion) return result
  } catch (err) {
    if (!isMemberRouteError(err)) throw err
  }

  if (tryWithoutUnion) {
    try {
      return await run(true)
    } catch (err) {
      if (!isMemberRouteError(err)) throw err
    }
  }

  throw new Error('Members list unavailable')
}
