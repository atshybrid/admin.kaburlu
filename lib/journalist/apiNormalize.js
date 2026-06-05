/** Parse journalist union list API responses into a consistent shape. */

const EMPTY = {
  items: [],
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 1,
  statusFilter: null,
}

/** True when object looks like a union member profile (not a list envelope). */
export function isMemberRecord(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false
  return Boolean(
    obj.id ||
      obj.profileId ||
      obj.fullName ||
      obj.mobileNumber ||
      (obj.documents && typeof obj.documents === 'object')
  )
}

/** Unwrap API envelopes: { success, items } | { success, data: member } | { data: { items } } */
export function unwrapApiPayload(raw) {
  if (raw == null) return null
  if (Array.isArray(raw)) return raw

  if (typeof raw !== 'object') return raw

  // Paginated list at root: { success: true, total, page, items: [] }
  if (Array.isArray(raw.items) || raw.total != null || raw.statusFilter != null) {
    return raw
  }

  // { success: true, data: member } or { data: { items } }
  if (raw.data != null && typeof raw.data === 'object') {
    if (Array.isArray(raw.data)) return raw.data
    if (raw.data.items || raw.data.members || raw.data.total != null) {
      return raw.data
    }
    if (isMemberRecord(raw.data)) return raw.data
  }

  if (raw.result && typeof raw.result === 'object') {
    if (isMemberRecord(raw.result)) return raw.result
    if (raw.result.items || raw.result.members) return raw.result
  }

  if (isMemberRecord(raw)) return raw

  return raw
}

export function normalizePagedList(raw) {
  const data = unwrapApiPayload(raw)
  if (!data) return { ...EMPTY }

  if (Array.isArray(data)) {
    return {
      items: data,
      total: data.length,
      page: 1,
      limit: data.length || 20,
      totalPages: 1,
      statusFilter: null,
    }
  }

  const items = data.items ?? data.members ?? data.applications ?? data.profiles ?? []
  const list = Array.isArray(items) ? items : []

  return {
    items: list,
    total: Number(data.total ?? list.length ?? 0),
    page: Number(data.page ?? 1),
    limit: Number(data.limit ?? 20),
    totalPages: Number(data.totalPages ?? Math.max(1, Math.ceil((data.total ?? list.length) / (data.limit || 20)))),
    statusFilter: data.statusFilter ?? null,
  }
}

/** GET /members/:id → member object from { success, data: { id, ... } } */
export function normalizeMemberDetail(raw) {
  if (raw == null) return null

  const unwrapped = unwrapApiPayload(raw)
  if (isMemberRecord(unwrapped)) return unwrapped

  // Direct envelope (unwrap may return wrapper if shape is unexpected)
  if (isMemberRecord(raw?.data)) return raw.data
  if (isMemberRecord(raw)) return raw

  return null
}

export function normalizeUnionSettings(raw) {
  const data = unwrapApiPayload(raw) || raw || {}
  return {
    ...data,
    unionName: data.unionName || data.name || '',
  }
}
