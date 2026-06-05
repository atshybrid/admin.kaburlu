/**
 * Load member queue / directory with API fallbacks.
 * Some backends register GET /members/:id before /members/pending → "pending" → MEMBER_NOT_FOUND.
 */
import { journalistApi } from '../api/services/journalistApi'
import { normalizePagedList } from './apiNormalize'
import { buildMembersListParams, buildPendingListParams } from './memberApiParams'
import { hasPendingDocuments, membershipPending } from './memberDisplay'

export function isMemberRouteError(err) {
  const code = err?.data?.code || err?.data?.errorCode
  return (
    err?.status === 404 ||
    code === 'MEMBER_NOT_FOUND' ||
    code === 'NOT_FOUND' ||
    code === 'ROUTE_NOT_FOUND'
  )
}

function filterQueueItems(items, status) {
  if (status === 'pending_membership') {
    return items.filter((r) => membershipPending(r))
  }
  if (status === 'pending_documents') {
    return items.filter((r) => hasPendingDocuments(r))
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
    const raw = await journalistApi.listPendingMembers(pendingParams)
    const parsed = normalizePagedList(raw)
    return { ...parsed, source: 'pending' }
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
    const raw = await journalistApi.listMembers(membersParams)
    const parsed = normalizePagedList(raw)
    const items = filterQueueItems(parsed.items, status)
    return {
      ...parsed,
      items,
      total: parsed.total || items.length,
      source: 'members-pending',
    }
  } catch (err) {
    if (!isMemberRouteError(err) && err?.status !== 400) throw err
  }

  if (tryWithoutUnion) {
    try {
      const raw = await journalistApi.listMembers(
        buildMembersListParams({
          unionName,
          page,
          limit,
          q,
          membershipStatus: 'PENDING',
          omitUnionName: true,
        })
      )
      const parsed = normalizePagedList(raw)
      let items = parsed.items
      const union = String(unionName || '').trim().toLowerCase()
      if (union) {
        items = items.filter(
          (r) => !r.unionName || String(r.unionName).toLowerCase().includes(union.slice(0, 12))
        )
      }
      items = filterQueueItems(items, status)
      return {
        ...parsed,
        items,
        total: items.length,
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
  const items = filterQueueItems(parsed.items, status)
  return { ...parsed, items, total: items.length, source: 'applications' }
}

/**
 * Member directory — GET /members with fallbacks.
 */
export async function fetchMemberDirectory({
  unionName,
  page = 1,
  limit = 20,
  q = '',
  membershipStatus = 'ALL',
  tryWithoutUnion = true,
}) {
  const params = buildMembersListParams({ unionName, page, limit, q, membershipStatus })

  try {
    const raw = await journalistApi.listMembers(params)
    return { ...normalizePagedList(raw), source: 'members' }
  } catch (err) {
    if (!isMemberRouteError(err)) throw err
  }

  if (tryWithoutUnion) {
    const raw = await journalistApi.listMembers(
      buildMembersListParams({
        unionName,
        page,
        limit,
        q,
        membershipStatus,
        omitUnionName: true,
      })
    )
    const parsed = normalizePagedList(raw)
    const union = String(unionName || '').trim().toLowerCase()
    let items = parsed.items
    if (union) {
      items = items.filter(
        (r) => !r.unionName || String(r.unionName).toLowerCase() === union
      )
    }
    return {
      ...parsed,
      items,
      total: parsed.total ?? items.length,
      source: 'members-all-unions',
    }
  }

  throw new Error('Members list unavailable')
}
