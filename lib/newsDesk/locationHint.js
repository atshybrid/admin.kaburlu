/** Build snapshot-compatible locationHint (see NEWS_DESK_V2_API_SAMPLES.json flow A). */

export function buildLocationHintFromFields({ district, mandal, area, note }) {
  const out = {}
  const d = String(district || '').trim()
  const m = String(mandal || '').trim()
  const a = String(area || '').trim()
  const n = String(note || '').trim()
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
  if (hint.district) parts.push(hint.district)
  if (hint.mandal) parts.push(hint.mandal)
  if (hint.area) parts.push(hint.area)
  if (hint.note) parts.push(hint.note)
  return parts.length ? parts.join(' · ') : null
}