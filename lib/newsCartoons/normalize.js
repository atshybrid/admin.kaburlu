/** Normalize News Cartoon API responses */

const EMPTY_LIST = { items: [], total: 0, page: 1, limit: 20, totalPages: 1 }

function unwrap(raw) {
  if (raw == null) return null
  if (Array.isArray(raw)) return raw
  if (typeof raw !== 'object') return raw
  if (raw.cartoon) return raw.cartoon
  if (raw.items || raw.total != null || raw.page != null) return raw
  if (raw.data != null) return unwrap(raw.data)
  if (raw.id) return raw
  return raw
}

export function normalizeCartoon(raw) {
  const c = unwrap(raw)
  if (!c || typeof c !== 'object') return null

  const seo = c.seo || {}
  return {
    ...c,
    id: c.id || c.cartoonId,
    title: c.title || '',
    caption: c.caption || '',
    rawText: c.rawText || '',
    imageUrl: c.imageUrl || '',
    categoryId: c.categoryId || c.category?.id || '',
    categoryName: c.category?.name || c.categoryName || '',
    stateId: c.stateId || '',
    districtId: c.districtId || '',
    mandalId: c.mandalId || '',
    languageCode: c.languageCode || 'te',
    placeName: c.placeName || '',
    latitude: c.latitude ?? null,
    longitude: c.longitude ?? null,
    status: String(c.status || 'DRAFT').toUpperCase(),
    publishToShortNews: c.publishToShortNews !== false,
    seoSource: c.seoSource || null,
    seo: {
      metaTitle: seo.metaTitle || '',
      metaDescription: seo.metaDescription || '',
      tags: Array.isArray(seo.tags) ? seo.tags : [],
      urlSlug: seo.urlSlug || '',
      altTexts: seo.altTexts || {},
    },
    shortNewsId: c.shortNewsId || null,
    viewCount: Number(c.viewCount ?? 0),
    createdAt: c.createdAt || null,
    updatedAt: c.updatedAt || null,
  }
}

export function normalizeCartoonList(raw) {
  const data = unwrap(raw)
  if (!data) return { ...EMPTY_LIST }

  const items = (Array.isArray(data) ? data : data.items || data.cartoons || [])
    .map(normalizeCartoon)
    .filter(Boolean)

  const total = Number(data.total ?? items.length)
  const limit = Number(data.limit ?? data.pageInfo?.limit ?? 20)
  const page = Number(data.page ?? 1)

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  }
}

export function cartoonStatusColor(status) {
  const s = String(status || '').toUpperCase()
  if (s === 'PUBLISHED') return 'green'
  if (s === 'DRAFT') return 'yellow'
  if (s === 'ARCHIVED') return 'gray'
  return 'blue'
}
