const STORAGE_KEY = 'kaburlu.dailyNewspaperNews.viewed'

function storageKey(tenantId, businessDate) {
  return `${String(tenantId || '')}:${String(businessDate || '')}`
}

function readAll() {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeAll(data) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* quota */
  }
}

export function loadViewedIdSet(tenantId, businessDate) {
  const all = readAll()
  const ids = all[storageKey(tenantId, businessDate)]
  return new Set(Array.isArray(ids) ? ids.map(String) : [])
}

export function persistViewedIdSet(tenantId, businessDate, idSet) {
  const all = readAll()
  all[storageKey(tenantId, businessDate)] = [...idSet]
  writeAll(all)
}

export function articleViewKey(article) {
  return String(article?.id || article?.slug || '').trim()
}