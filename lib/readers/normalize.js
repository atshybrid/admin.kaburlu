/** Normalize reader admin API responses */

export const PERSONA_LABELS = {
  reader: 'Reader',
  citizen_reporter: 'Citizen Reporter',
  govt_official: 'Government Official',
  public_figure: 'Public Figure',
}

export const APPROVAL_STATUS_LABELS = {
  ACTIVE: 'Active',
  PENDING_APPROVAL: 'Pending approval',
  REJECTED: 'Rejected',
  SUSPENDED: 'Suspended',
}

function unwrapList(raw) {
  if (Array.isArray(raw)) return raw
  if (raw?.data && Array.isArray(raw.data)) return raw.data
  if (raw?.items && Array.isArray(raw.items)) return raw.items
  return []
}

function unwrapPageInfo(raw) {
  return raw?.pageInfo || raw?.data?.pageInfo || { limit: 50, hasMore: false }
}

export function normalizeReaderRow(row) {
  if (!row || typeof row !== 'object') return null
  const profile = row.readerProfile || {}
  const persona = profile.persona || null
  return {
    ...row,
    userId: row.userId || row.id,
    displayName: row.displayName || row.fullName || row.email || row.mobileNumber || '—',
    readerProfile: {
      ...profile,
      persona,
      personaLabel: profile.personaLabel || PERSONA_LABELS[persona] || persona,
      approvalStatus: profile.approvalStatus || row.status || 'ACTIVE',
    },
  }
}

export function normalizeReaderList(raw) {
  const items = unwrapList(raw).map(normalizeReaderRow).filter(Boolean)
  return {
    items,
    pageInfo: unwrapPageInfo(raw),
  }
}

export function normalizePendingList(raw) {
  return unwrapList(raw).map(normalizeReaderRow).filter(Boolean)
}

export function normalizePersonas(raw) {
  const personas = raw?.data?.personas || raw?.personas || raw?.readerFeeds?.personas || []
  return Array.isArray(personas) ? personas : []
}

export function readerDisplayName(row) {
  return row?.displayName || row?.email || row?.mobileNumber || row?.userId || '—'
}

export function personaRequiresApproval(personaKey, personas = []) {
  const found = personas.find((p) => p.key === personaKey)
  if (found) return !!found.requiresApproval
  return personaKey === 'govt_official' || personaKey === 'public_figure'
}
