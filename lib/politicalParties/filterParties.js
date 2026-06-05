import { normalizePartyRecord, partyOptionLabel } from './normalize'

/** National parties appear in every state survey */
export function isNationalParty(party) {
  const p = normalizePartyRecord(party) || party
  const rec = String(p?.recognition || p?.scope || p?.partyScope || '').toUpperCase()
  return (
    rec === 'NATIONAL' ||
    p?.isNational === true ||
    p?.nationalParty === true
  )
}

/** Collect state names/codes from party record */
export function partyStateKeys(party) {
  const p = normalizePartyRecord(party) || party
  const keys = new Set()
  const add = (v) => {
    if (v == null || v === '') return
    if (Array.isArray(v)) v.forEach(add)
    else keys.add(String(v).trim().toLowerCase())
  }
  add(p.state)
  add(p.primaryState)
  add(p.stateName)
  add(p.stateCode)
  add(p.states)
  add(p.activeStates)
  add(p.operatingStates)
  return keys
}

/** Match selected survey state (name or code) */
export function partyMatchesState(party, selectedState, { lenientIfNoState = true } = {}) {
  const state = String(selectedState || '').trim()
  if (!state) return true

  if (isNationalParty(party)) return true

  const needle = state.toLowerCase()
  const keys = partyStateKeys(party)
  // API often omits state on party rows — still show in picker/search
  if (!keys.size) return lenientIfNoState

  return [...keys].some(
    (k) => k === needle || k.includes(needle) || needle.includes(k)
  )
}

function partySearchText(party) {
  const p = normalizePartyRecord(party) || party
  if (!p) return ''
  return [
    partyOptionLabel(p),
    p.partyCode,
    p.shortCode,
    p.code,
    p.displayName,
    p.name,
    p.fullName,
    p.shortName,
    p.abbreviation,
    p.symbolText,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function looseTokenMatch(hay, word) {
  const w = String(word || '').trim().toLowerCase()
  if (!w) return true
  if (hay.includes(w)) return true

  const tokens = hay.split(/[\s—–-]+/).filter(Boolean)
  for (const t of tokens) {
    if (t.startsWith(w) || w.startsWith(t)) return true
    if (w.length >= 4 && t.length >= 4) {
      const stem = w.slice(0, 4)
      if (t.includes(stem) || hay.includes(stem)) return true
    }
  }
  return false
}

export function filterPartiesBySearch(parties, q, { loose = true } = {}) {
  const term = String(q || '').trim().toLowerCase()
  if (!term) return parties
  const words = term.split(/\s+/).filter(Boolean)
  return parties.filter((p) => {
    const hay = partySearchText(p)
    if (!loose) return words.every((w) => hay.includes(w))
    return words.every((w) => looseTokenMatch(hay, w))
  })
}

export function filterPartiesByStateAndSearch(parties, state, q) {
  let list = Array.isArray(parties) ? parties : []
  list = list.map(normalizePartyRecord).filter(Boolean)
  list = list.filter((p) => partyMatchesState(p, state))
  list = filterPartiesBySearch(list, q)
  return list
}
