/** Build snapshot-compatible locationHint (see NEWS_DESK_V2_API_SAMPLES.json flow A). */

const STATE_NAME_ALIASES = [
  { test: /^(telangana|తెలంగాణ|తెలంగాణా|ts)$/i, canonical: 'Telangana' },
  { test: /^(andhra(\s*pradesh)?|ఆంధ్ర|ఆంధ్రప్రదేశ్|ap)$/i, canonical: 'Andhra Pradesh' },
]

/** If text is only a state name (Telugu/English), return canonical English state name. */
export function canonicalStateFromText(text) {
  const t = String(text || '').trim()
  if (!t) return null
  for (const row of STATE_NAME_ALIASES) {
    if (row.test.test(t)) return row.canonical
  }
  return null
}

export function buildLocationHintFromFields({ state, district, mandal, area, note }) {
  const out = {}
  const st = String(state || '').trim()
  const d = String(district || '').trim()
  const m = String(mandal || '').trim()
  const a = String(area || '').trim()
  const n = String(note || '').trim()
  if (st) out.state = st
  if (d) out.district = d
  if (m) out.mandal = m
  if (a) out.area = a
  if (n) out.note = n
  return Object.keys(out).length ? out : null
}

export function formatLocationHintDisplay(hint) {
  if (hint == null) return null
  if (typeof hint === 'string') return hint
  if (typeof hint !== 'object') return String(hint)
  const parts = []
  if (hint.state) parts.push(hint.state)
  if (hint.district) parts.push(hint.district)
  if (hint.mandal) parts.push(hint.mandal)
  if (hint.area) parts.push(hint.area)
  if (hint.note) parts.push(hint.note)
  return parts.length ? parts.join(' · ') : null
}