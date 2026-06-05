import { politicalPartiesApi } from '../api/services/politicalPartiesApi'
import { normalizePartyList, normalizePartyRecord } from './normalize'
import { filterPartiesByStateAndSearch, filterPartiesBySearch } from './filterParties'

function dedupeParties(items) {
  const map = new Map()
  for (const p of items) {
    const norm = normalizePartyRecord(p)
    if (!norm) continue
    const key = norm.id || norm.partyCode
    if (!map.has(key)) map.set(key, norm)
  }
  return [...map.values()]
}

async function loadAdmin(params) {
  try {
    return normalizePartyList(await politicalPartiesApi.listAdmin(params)).items
  } catch {
    return []
  }
}

async function loadPublic(params) {
  try {
    return normalizePartyList(await politicalPartiesApi.searchPublic(params)).items
  } catch {
    return []
  }
}

async function loadFromApis(params) {
  let items = await loadAdmin(params)
  if (!items.length) items = await loadPublic(params)
  return items
}

/**
 * Load parties — name search uses ?q= only (state filtered in UI).
 * Passing state+q together often returns empty from API.
 */
export async function fetchPartiesForSurvey({ state = '', q = '', limit = 100 } = {}) {
  const term = String(q || '').trim()
  const stateName = String(state || '').trim()
  const base = { page: '1', limit: String(limit) }

  let items = []

  if (term) {
    // Search by name/code — do NOT send state to API (state filter breaks many matches)
    items = await loadFromApis({ ...base, q: term })
    // Fallback: load broader list and filter client-side
    if (!items.length) {
      const broad = await loadFromApis(base)
      items = filterPartiesBySearch(broad, term)
    }
    return filterPartiesBySearch(dedupeParties(items), term)
  } else if (stateName) {
    items = await loadFromApis({ ...base, state: stateName })
    if (!items.length) {
      const broad = await loadFromApis(base)
      items = filterPartiesByStateAndSearch(broad, stateName, '')
    }
  } else {
    items = await loadFromApis(base)
  }

  return filterPartiesByStateAndSearch(dedupeParties(items), stateName, term)
}

/** Full list for a state (cache for instant client search) */
export async function fetchAllPartiesForState(state, limit = 150) {
  const stateName = String(state || '').trim()
  if (!stateName) return []
  const base = { page: '1', limit: String(limit) }
  let items = await loadFromApis({ ...base, state: stateName })
  if (!items.length) {
    const broad = await loadFromApis(base)
    items = filterPartiesByStateAndSearch(broad, stateName, '')
  }
  return filterPartiesByStateAndSearch(dedupeParties(items), stateName, '')
}
