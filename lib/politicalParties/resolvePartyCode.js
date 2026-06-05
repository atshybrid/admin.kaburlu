import { normalizePartyRecord } from './normalize'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const MONGO_ID_RE = /^[0-9a-f]{24}$/i

/** True if value looks like a DB id, not a party code (BJP, BRS, …) */
export function looksLikePartyId(value) {
  const s = String(value || '').trim()
  if (!s) return false
  return UUID_RE.test(s) || MONGO_ID_RE.test(s) || s.length > 12
}

/**
 * Canonical party code for survey API — never use UUID as partyCode.
 */
export function resolvePartyCode(party) {
  const p = normalizePartyRecord(party) || party
  if (!p) return ''

  const candidates = [
    p.partyCode,
    p.shortCode,
    p.code,
    p.abbreviation,
  ]
    .map((v) => String(v || '').trim().toUpperCase())
    .filter(Boolean)

  for (const code of candidates) {
    if (!looksLikePartyId(code) && /^[A-Z0-9_-]{2,12}$/.test(code)) return code
  }
  return ''
}
