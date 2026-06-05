import { fetchAllPartiesForState } from './fetchParties'

const cache = new Map()

/** In-memory cache — avoids reloading parties on every wizard open */
export async function getPartiesForStateCached(state) {
  const key = String(state || '').trim()
  if (!key) return []
  if (cache.has(key)) return cache.get(key)
  const list = await fetchAllPartiesForState(key, 80)
  cache.set(key, list)
  return list
}

export function clearPartyCache(state) {
  if (state) cache.delete(String(state).trim())
  else cache.clear()
}
