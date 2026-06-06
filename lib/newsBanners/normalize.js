/** Normalize News Banner API responses */

const EMPTY_LIST = { items: [], total: 0 }

function unwrap(raw) {
  if (raw == null) return null
  if (Array.isArray(raw)) return raw
  if (typeof raw !== 'object') return raw
  if (raw.banner) return raw.banner
  if (raw.items || raw.total != null) return raw
  if (raw.data != null) return unwrap(raw.data)
  if (raw.id) return raw
  return raw
}

export function normalizeBanner(raw) {
  const b = unwrap(raw)
  if (!b || typeof b !== 'object') return null

  return {
    ...b,
    id: b.id || b.bannerId,
    title: b.title || '',
    subtitle: b.subtitle || '',
    mediaType: String(b.mediaType || 'IMAGE').toUpperCase(),
    mediaUrl: b.mediaUrl || '',
    thumbnailUrl: b.thumbnailUrl || null,
    linkUrl: b.linkUrl || null,
    tenantId: b.tenantId ?? null,
    tenant: b.tenant || null,
    sortOrder: Number(b.sortOrder ?? 0),
    status: String(b.status || 'ACTIVE').toUpperCase(),
    isActiveNow: b.isActiveNow ?? b.status === 'ACTIVE',
    createdAt: b.createdAt || null,
    updatedAt: b.updatedAt || null,
  }
}

export function normalizeBannerList(raw) {
  const data = unwrap(raw)
  if (!data) return { ...EMPTY_LIST }

  const items = (Array.isArray(data) ? data : data.items || [])
    .map(normalizeBanner)
    .filter(Boolean)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  return {
    items,
    total: Number(data.total ?? items.length),
  }
}

export function bannerStatusColor(status) {
  const s = String(status || '').toUpperCase()
  if (s === 'ACTIVE') return 'green'
  if (s === 'DRAFT') return 'yellow'
  if (s === 'INACTIVE' || s === 'ARCHIVED') return 'gray'
  return 'blue'
}

export function isVideoBanner(banner) {
  return String(banner?.mediaType || '').toUpperCase() === 'VIDEO'
}
