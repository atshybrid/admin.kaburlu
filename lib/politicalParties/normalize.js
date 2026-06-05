/** Normalize political party API responses (admin + public shapes) */

const EMPTY_LIST = { items: [], total: 0, page: 1, limit: 25, totalPages: 1 }

function unwrap(raw) {
  if (raw == null) return null
  if (Array.isArray(raw)) return raw
  if (typeof raw !== 'object') return raw
  if (Array.isArray(raw.items) || raw.total != null) return raw
  if (raw.data != null) {
    if (Array.isArray(raw.data)) return raw.data
    if (raw.data.items || raw.data.parties || raw.data.total != null) return raw.data
    if (raw.data.id || raw.data.partyCode || raw.data.shortCode) return raw.data
  }
  if (raw.id || raw.partyCode || raw.shortCode) return raw
  return raw
}

/**
 * Map backend fields → UI fields
 * API may send: shortCode, abbreviation, name, symbolImageUrl
 */
export function normalizePartyRecord(p) {
  if (!p || typeof p !== 'object') return null

  const partyCode = String(
    p.partyCode || p.shortCode || p.code || p.abbreviation || ''
  ).trim()

  const displayName = String(
    p.displayName ||
      p.name ||
      p.fullName ||
      p.abbreviation ||
      p.shortName ||
      partyCode ||
      ''
  ).trim()

  const id = p.id || p.partyId || p._id
  if (!id && !partyCode) return null

  const isDbId = /^[0-9a-f-]{20,}$/i.test(partyCode)
  const safeCode = partyCode && !isDbId ? partyCode.toUpperCase() : ''

  return {
    ...p,
    id: String(id || safeCode),
    partyCode: safeCode,
    displayName: displayName || partyCode || String(id),
    shortName: p.shortName || p.abbreviation || partyCode,
    primaryColor: p.primaryColor || p.colorPrimary || '#1e3a5f',
    secondaryColor: p.secondaryColor || p.colorSecondary || '#ffffff',
    symbolUrl: p.symbolUrl || p.symbolImageUrl || p.logoUrl || null,
    symbolText: p.symbolText || p.symbolName || null,
    isActive: p.isActive !== false && p.active !== false,
  }
}

export function normalizePartyList(raw) {
  const data = unwrap(raw)
  if (!data) return { ...EMPTY_LIST }

  let list = []
  if (Array.isArray(data)) {
    list = data
  } else {
    const items = data.items ?? data.parties ?? []
    list = Array.isArray(items) ? items : []
  }

  const normalized = list.map(normalizePartyRecord).filter(Boolean)
  const limit = Number(data.limit ?? 25)
  const total = Number(data.total ?? normalized.length)

  return {
    items: normalized,
    total,
    page: Number(data.page ?? 1),
    limit,
    totalPages: Number(data.totalPages ?? Math.max(1, Math.ceil(total / limit))),
  }
}

export function normalizeParty(raw) {
  const data = unwrap(raw)
  if (!data || typeof data !== 'object') return null
  return normalizePartyRecord(data)
}

export function partyDisplayName(party) {
  const p = normalizePartyRecord(party) || party
  return p?.displayName || p?.partyCode || p?.shortCode || '—'
}

export function partyOptionLabel(party) {
  const p = normalizePartyRecord(party) || party
  if (!p) return '—'
  const code = p.partyCode || p.shortCode
  const name = p.displayName
  if (code && name && code.toUpperCase() !== name.toUpperCase()) {
    return `${code} — ${name}`
  }
  return name || code || '—'
}

export function partyColors(party) {
  const p = normalizePartyRecord(party) || party
  return {
    primary: p?.primaryColor || '#1e3a5f',
    secondary: p?.secondaryColor || '#ffffff',
  }
}
