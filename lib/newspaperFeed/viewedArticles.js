const STORAGE_KEY = 'kaburlu.dailyNewspaperNews.viewed'
const LEGACY_KEY = STORAGE_KEY
const STORAGE_KEY_V2 = `${STORAGE_KEY}.v2`
/** Viewed markers expire after this (refresh-safe desk session). */
export const VIEWED_TTL_MS = 25 * 60 * 60 * 1000

function storageKey(tenantId, businessDate) {
  return `${String(tenantId || '')}:${String(businessDate || '')}`
}

function readLegacyFlat() {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function readStore() {
  if (typeof window === 'undefined') return { buckets: {} }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_V2)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.buckets && typeof parsed.buckets === 'object') return parsed
    }
    const legacy = readLegacyFlat()
    const buckets = {}
    const now = Date.now()
    for (const [key, ids] of Object.entries(legacy)) {
      if (!Array.isArray(ids) || !ids.length) continue
      const entries = {}
      ids.forEach((id) => {
        entries[String(id)] = now
      })
      buckets[key] = { entries, updatedAt: now }
    }
    return { buckets }
  } catch {
    return { buckets: {} }
  }
}

function writeStore(store) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(store))
  } catch {
    /* quota */
  }
}

function pruneExpired(store) {
  const now = Date.now()
  const buckets = { ...(store.buckets || {}) }
  for (const key of Object.keys(buckets)) {
    const bucket = buckets[key]
    const entries = { ...(bucket?.entries || {}) }
    for (const [id, viewedAt] of Object.entries(entries)) {
      if (now - Number(viewedAt) > VIEWED_TTL_MS) delete entries[id]
    }
    if (Object.keys(entries).length) {
      buckets[key] = { entries, updatedAt: bucket?.updatedAt || now }
    } else {
      delete buckets[key]
    }
  }
  return { buckets }
}

export function loadViewedIdSet(tenantId, businessDate) {
  const pruned = pruneExpired(readStore())
  writeStore(pruned)
  const bucket = pruned.buckets[storageKey(tenantId, businessDate)]
  if (!bucket?.entries) return new Set()
  const now = Date.now()
  const ids = Object.entries(bucket.entries)
    .filter(([, viewedAt]) => now - Number(viewedAt) <= VIEWED_TTL_MS)
    .map(([id]) => id)
  return new Set(ids)
}

export function persistViewedIdSet(tenantId, businessDate, idSet) {
  const pruned = pruneExpired(readStore())
  const key = storageKey(tenantId, businessDate)
  const now = Date.now()
  const entries = { ...(pruned.buckets[key]?.entries || {}) }
  for (const id of idSet) {
    const s = String(id)
    if (!s) continue
    if (!entries[s]) entries[s] = now
  }
  pruned.buckets[key] = { entries, updatedAt: now }
  writeStore(pruned)
}

export function articleViewKey(article) {
  return String(article?.id || article?.slug || '').trim()
}